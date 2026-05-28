from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from app.models.schemas import (
    AccessControlledEndpoint,
    AccessControlResult,
    AccessControlSummary,
    ApiEndpoint,
    ArchitectureSmell,
    Component,
    ProjectFile,
)
from app.utils.file_utils import safe_read_text


AUTH_INDICATORS = (
    "jsonwebtoken",
    "jwt.sign",
    "jwt.verify",
    "authorization",
    "bearer",
    "authmiddleware",
    "authenticate",
    "protect",
    "verifytoken",
    "requireauth",
    "isauthenticated",
    "oauth2passwordbearer",
    "httpbearer",
    "@preauthorize",
    "@secured",
)

AUTH_MIDDLEWARE = ("auth", "authenticate", "protect", "verifytoken", "requireauth", "isauthenticated", "jwt")
ROLE_ENFORCERS = ("authorize", "authorizerole", "requirerole", "isadmin", "adminonly", "employeeonly", "preauthorize", "secured")
ROLE_INDICATORS = ("role", "roles", "admin", "employee", "user", "permissions", "privileges", "adminprivileges")
PUBLIC_KEYWORDS = ("login", "signup", "register", "forgot-password", "forgotpassword", "reset-password", "resetpassword", "verify-otp", "verifyotp", "resend-otp", "resendotp", "health")
SENSITIVE_KEYWORDS = ("employees", "employee", "orders", "order", "payment", "profile", "update", "delete", "admin", "users", "dashboard")
HARDCODED_ADMIN_PATTERNS = (
    r"username\s*={2,3}\s*['\"]admin['\"]",
    r"role\s*={2,3}\s*['\"]admin['\"]",
    r"x-admin-secret",
    r"ADMIN_SECRET",
    r"adminPrivileges",
)


@dataclass
class RouteMatch:
    method: str
    path: str
    middleware: list[str]
    handler: str
    file_path: str


class AccessControlAnalyzer:
    def analyze(
        self,
        root: Path,
        files: list[ProjectFile],
        endpoints: list[ApiEndpoint],
        javascript_route_prefixes: dict[str, str],
    ) -> tuple[AccessControlResult, list[ArchitectureSmell], list[Component]]:
        sources = self._read_sources(root, files)
        joined_source = "\n".join(sources.values())
        route_matches = self._express_routes(sources, javascript_route_prefixes)
        route_lookup = {(route.file_path, route.method, route.path): route for route in route_matches}

        auth_detected = any(token in joined_source.lower() for token in AUTH_INDICATORS)
        roles_detected = self._roles_detected(joined_source)
        role_defined = self._role_defined(joined_source, roles_detected)
        role_enforcement_detected = any(self._contains_role_enforcer(route.middleware) for route in route_matches)

        access_endpoints: list[AccessControlledEndpoint] = []
        for endpoint in endpoints:
            route_match = route_lookup.get((endpoint.filePath, endpoint.method, endpoint.path))
            middleware = route_match.middleware if route_match else self._framework_middleware(sources.get(endpoint.filePath, ""), endpoint)
            handler = route_match.handler if route_match and route_match.handler else endpoint.handler
            access_level, risk, reason = self._infer_access(endpoint.path, middleware)
            access_endpoints.append(
                AccessControlledEndpoint(
                    method=endpoint.method,
                    path=endpoint.path,
                    handler=handler,
                    controller=self._controller_name(endpoint.filePath),
                    middleware=middleware,
                    accessLevel=access_level,
                    risk=risk,
                    reason=reason,
                    filePath=endpoint.filePath,
                )
            )

        result = AccessControlResult(
            authDetected=auth_detected,
            rolesDetected=roles_detected,
            roleEnforcementDetected=role_enforcement_detected,
            summary=self._summary(access_endpoints),
            endpoints=access_endpoints,
        )
        smells = self._smells(result, role_defined, role_enforcement_detected, joined_source)
        components = self._security_components(sources, route_matches)
        return result, smells, components

    def _read_sources(self, root: Path, files: list[ProjectFile]) -> dict[str, str]:
        supported = {"javascript", "typescript", "python", "java"}
        return {
            file.path: safe_read_text(root / file.path)
            for file in files
            if file.language in supported
        }

    def _express_routes(self, sources: dict[str, str], route_prefixes: dict[str, str]) -> list[RouteMatch]:
        routes: list[RouteMatch] = []
        for relative_path, source in sources.items():
            if not relative_path.lower().endswith((".js", ".jsx", ".ts", ".tsx")):
                continue
            prefix = route_prefixes.get(self._path_key(relative_path), "")
            for match in re.finditer(r"\b(?P<router>router|app)\.(?P<method>get|post|put|delete|patch|options|head)\(\s*['\"](?P<path>[^'\"]*)['\"]\s*,", source, re.IGNORECASE):
                args = self._route_arguments(source, match.end())
                callables = self._split_callables(args)
                if not callables:
                    continue
                handler = self._callable_name(callables[-1]) or "inlineHandler"
                middleware = [self._callable_name(item) or item.strip() for item in callables[:-1]]
                full_path = self._join_paths(prefix if match.group("router") == "router" else "", match.group("path"))
                routes.append(
                    RouteMatch(
                        method=match.group("method").upper(),
                        path=full_path,
                        middleware=[item for item in middleware if item],
                        handler=handler,
                        file_path=relative_path,
                    )
                )
        return routes

    def _route_arguments(self, source: str, start: int) -> str:
        depth = 1
        quote = ""
        escaped = False
        for index in range(start, len(source)):
            char = source[index]
            if quote:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == quote:
                    quote = ""
                continue
            if char in {"'", '"', "`"}:
                quote = char
                continue
            if char in "([{":
                depth += 1
            elif char in ")]}":
                depth -= 1
                if depth == 0:
                    return source[start:index]
        return ""

    def _split_callables(self, args: str) -> list[str]:
        items: list[str] = []
        current: list[str] = []
        depth = 0
        quote = ""
        escaped = False
        for char in args:
            if quote:
                current.append(char)
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == quote:
                    quote = ""
                continue
            if char in {"'", '"', "`"}:
                quote = char
                current.append(char)
                continue
            if char in "([{":
                depth += 1
            elif char in ")]}":
                depth = max(0, depth - 1)
            if char == "," and depth == 0:
                item = "".join(current).strip()
                if item:
                    items.append(item)
                current = []
            else:
                current.append(char)
        item = "".join(current).strip()
        if item:
            items.append(item)
        return items

    def _callable_name(self, value: str) -> str:
        stripped = value.strip()
        if re.search(r"=>|\bfunction\b", stripped):
            return "inlineHandler"
        call_match = re.match(r"([A-Za-z_$][\w$.]*)\s*\((.*)\)$", stripped, re.DOTALL)
        if call_match:
            args = call_match.group(2)
            quoted = re.findall(r"['\"]([^'\"]+)['\"]", args)
            if quoted:
                return f"{call_match.group(1)}({', '.join(quoted)})"
            return call_match.group(1)
        name_match = re.match(r"([A-Za-z_$][\w$.]*)$", stripped)
        return name_match.group(1) if name_match else stripped[:80]

    def _framework_middleware(self, source: str, endpoint: ApiEndpoint) -> list[str]:
        middleware: list[str] = []
        if "Depends(" in source or "Security(" in source:
            function_match = re.search(rf"\b(?:async\s+def|def)\s+{re.escape(endpoint.handler)}\s*\(([^)]*)\)", source)
            if function_match and re.search(r"\b(Depends|Security)\s*\(", function_match.group(1)):
                middleware.append("Depends/Security")
        if "@PreAuthorize" in source or "@Secured" in source:
            middleware.append("PreAuthorize/Secured")
        return middleware

    def _infer_access(self, path: str, middleware: list[str]) -> tuple[str, str, str]:
        normalized_path = path.lower()
        normalized_middleware = " ".join(middleware).lower()
        public_keyword = self._matching_keyword(normalized_path, PUBLIC_KEYWORDS)
        sensitive_keyword = self._matching_keyword(normalized_path, SENSITIVE_KEYWORDS)

        if public_keyword:
            return "PUBLIC", "NONE", f"Endpoint contains public keyword '{public_keyword}'."
        if "admin" in normalized_middleware and "employee" in normalized_middleware:
            return "ADMIN_OR_EMPLOYEE", "LOW", "Route middleware appears to allow admin or employee roles."
        if "admin" in normalized_middleware or "isadmin" in normalized_middleware or "adminonly" in normalized_middleware:
            return "ADMIN", "LOW", "Route middleware enforces an admin role."
        if "employee" in normalized_middleware or "employeeonly" in normalized_middleware:
            return "EMPLOYEE", "LOW", "Route middleware enforces an employee role."
        if any(token in normalized_middleware for token in AUTH_MIDDLEWARE) or middleware:
            return "AUTHENTICATED", "LOW", "Authentication middleware was detected without a specific role."
        if sensitive_keyword:
            return (
                "UNPROTECTED_SENSITIVE",
                "HIGH",
                f"Endpoint contains sensitive keyword '{sensitive_keyword}' but no auth middleware was detected.",
            )
        return "UNKNOWN", "MEDIUM", "No public keyword or route-level auth middleware was detected."

    def _summary(self, endpoints: list[AccessControlledEndpoint]) -> AccessControlSummary:
        return AccessControlSummary(
            publicEndpoints=sum(1 for endpoint in endpoints if endpoint.accessLevel == "PUBLIC"),
            authenticatedEndpoints=sum(1 for endpoint in endpoints if endpoint.accessLevel == "AUTHENTICATED"),
            adminEndpoints=sum(1 for endpoint in endpoints if endpoint.accessLevel == "ADMIN"),
            employeeEndpoints=sum(1 for endpoint in endpoints if endpoint.accessLevel == "EMPLOYEE"),
            unknownEndpoints=sum(1 for endpoint in endpoints if endpoint.accessLevel == "UNKNOWN"),
            unprotectedSensitiveEndpoints=sum(1 for endpoint in endpoints if endpoint.accessLevel == "UNPROTECTED_SENSITIVE"),
        )

    def _smells(
        self,
        result: AccessControlResult,
        role_defined: bool,
        role_enforcement_detected: bool,
        joined_source: str,
    ) -> list[ArchitectureSmell]:
        smells: list[ArchitectureSmell] = []
        if role_defined and not role_enforcement_detected:
            smells.append(
                ArchitectureSmell(
                    type="ROLE_DEFINED_NOT_ENFORCED",
                    severity="HIGH",
                    title="Roles are defined but not enforced",
                    description="The project defines roles or includes roles in JWT tokens, but no route-level role authorization middleware was detected.",
                    affectedComponents=["Access control"],
                    recommendation="Add centralized role authorization middleware and apply it to protected routes.",
                )
            )
        for endpoint in result.endpoints:
            if endpoint.accessLevel != "UNPROTECTED_SENSITIVE":
                continue
            smells.append(
                ArchitectureSmell(
                    type="MISSING_AUTHORIZATION_MIDDLEWARE",
                    severity="HIGH",
                    title="Sensitive endpoint lacks authorization middleware",
                    description="Sensitive endpoint appears to be accessible without authentication or role middleware.",
                    affectedComponents=[f"{endpoint.method} {endpoint.path}"],
                    recommendation="Protect sensitive routes with JWT verification and role-aware middleware.",
                )
            )
        if any(re.search(pattern, joined_source, re.IGNORECASE) for pattern in HARDCODED_ADMIN_PATTERNS):
            smells.append(
                ArchitectureSmell(
                    type="HARDCODED_ADMIN_LOGIC",
                    severity="MEDIUM",
                    title="Hardcoded admin logic detected",
                    description="Admin checks or secrets appear to be handled directly in application code.",
                    affectedComponents=["Access control"],
                    recommendation="Move admin authorization logic into centralized middleware.",
                )
            )
        return smells

    def _security_components(self, sources: dict[str, str], route_matches: list[RouteMatch]) -> list[Component]:
        components: list[Component] = []
        middleware_names = sorted({item for route in route_matches for item in route.middleware if item and item != "inlineHandler"})
        if any(any(token in source.lower() for token in AUTH_INDICATORS) for source in sources.values()):
            components.append(
                Component(
                    id="access-control:authentication",
                    label="Authentication",
                    type="security",
                    filePath="access-control",
                    metadata={"detected": True},
                )
            )
        if middleware_names:
            components.append(
                Component(
                    id="access-control:middleware",
                    label="Authorization Middleware",
                    type="middleware",
                    filePath="access-control",
                    metadata={"middleware": middleware_names},
                )
            )
        return components

    def _roles_detected(self, source: str) -> list[str]:
        lower = source.lower()
        roles = []
        role_patterns = {
            "admin": (r"\badmin\b", r"\badminprivileges\b", r"\bisadmin\b", r"\badminonly\b"),
            "employee": (r"\bemployees?\b", r"\bemployeeonly\b"),
            "user": (r"\buser\b",),
        }
        for role, patterns in role_patterns.items():
            if any(re.search(pattern, lower) for pattern in patterns):
                roles.append(role)
        return roles

    def _role_defined(self, source: str, roles_detected: list[str]) -> bool:
        return bool(
            roles_detected
            and (
                re.search(r"\broles?\s*[:=]", source, re.IGNORECASE)
                or re.search(r"\bjwt\.sign\s*\([^)]*\brole\b", source, re.IGNORECASE | re.DOTALL)
                or re.search(r"\b(adminPrivileges|permissions|privileges)\b", source, re.IGNORECASE)
            )
        )

    def _contains_role_enforcer(self, middleware: list[str]) -> bool:
        normalized = " ".join(middleware).lower()
        return any(token in normalized for token in ROLE_ENFORCERS) and ("admin" in normalized or "employee" in normalized or "role" in normalized)

    def _matching_keyword(self, value: str, keywords: tuple[str, ...]) -> str:
        normalized = value.replace("_", "-")
        for keyword in keywords:
            compact = keyword.replace("-", "")
            if keyword in normalized or compact in normalized.replace("-", ""):
                return keyword
        return ""

    def _controller_name(self, file_path: str) -> str:
        stem = Path(file_path).stem
        return "".join(part[:1].upper() + part[1:] for part in re.split(r"[-_.]+", stem) if part)

    def _path_key(self, relative_path: str) -> str:
        return str(Path(relative_path).with_suffix("")).replace("\\", "/").lower()

    def _join_paths(self, base: str, path: str) -> str:
        if not base:
            return path or "/"
        if not path or path == "/":
            return base if base.startswith("/") else f"/{base}"
        return f"/{base.strip('/')}/{path.strip('/')}"
