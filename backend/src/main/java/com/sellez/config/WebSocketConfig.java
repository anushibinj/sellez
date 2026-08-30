package com.sellez.config;

import com.sellez.security.CookieService;
import com.sellez.security.JwtService;
import com.sellez.security.UserPrincipal;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final JwtService jwtService;
    private final CookieService cookieService;
    private final SellezProperties properties;
    private final UserAccountRepository users;

    public WebSocketConfig(JwtService jwtService, CookieService cookieService, SellezProperties properties, UserAccountRepository users) {
        this.jwtService = jwtService;
        this.cookieService = cookieService;
        this.properties = properties;
        this.users = users;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(properties.getCors().origins().toArray(String[]::new))
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
                        if (request instanceof ServletServerHttpRequest servletRequest) {
                            String token = cookieService.read(servletRequest.getServletRequest().getCookies(),
                                    properties.getSecurity().getAccessCookieName());
                            if (token == null) {
                                return false;
                            }
                            try {
                                UserAccount user = users.findWithCommunityById(jwtService.parseUserId(token)).orElse(null);
                                if (user == null) {
                                    return false;
                                }
                                attributes.put("principal", new UserPrincipal(user));
                                return true;
                            } catch (Exception e) {
                                return false;
                            }
                        }
                        return false;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                               WebSocketHandler wsHandler, Exception exception) {
                    }
                });
    }
}
