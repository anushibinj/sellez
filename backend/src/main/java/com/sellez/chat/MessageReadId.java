package com.sellez.chat;

import java.io.Serializable;
import java.util.UUID;

public class MessageReadId implements Serializable {
    private UUID message;
    private UUID user;

    public UUID getMessage() { return message; }
    public void setMessage(UUID message) { this.message = message; }
    public UUID getUser() { return user; }
    public void setUser(UUID user) { this.user = user; }
}
