package com.sellez.auth;

import com.sellez.security.AuthSupport;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/send-otp")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendOtp(@Valid @RequestBody AuthService.SendOtpRequest request) {
        authService.sendOtp(request.email());
    }

    @PostMapping("/verify-otp")
    public AuthService.MeResponse verify(@Valid @RequestBody AuthService.VerifyOtpRequest request, HttpServletResponse response) {
        return authService.verifyOtp(request.email(), request.code(), response);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
    }

    @PostMapping("/refresh")
    public AuthService.MeResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        return authService.refresh(request, response);
    }

    @GetMapping("/me")
    public AuthService.MeResponse me() {
        return authService.me(AuthSupport.requireUser());
    }

    @PostMapping("/onboarding")
    public AuthService.MeResponse onboard(@RequestBody(required = false) AuthService.OnboardRequest request) {
        return authService.onboard(AuthSupport.requireUser(), request == null ? null : request.name());
    }
}
