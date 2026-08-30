CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    name VARCHAR(120),
    alias VARCHAR(80) NOT NULL,
    avatar_color VARCHAR(16) NOT NULL,
    community_id UUID NOT NULL REFERENCES communities (id),
    role VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
    rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    onboarded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_community ON users (community_id);

CREATE TABLE otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_email_created ON otp_challenges (email, created_at DESC);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id VARCHAR(12) NOT NULL UNIQUE,
    seller_id UUID NOT NULL REFERENCES users (id),
    community_id UUID NOT NULL REFERENCES communities (id),
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    category VARCHAR(40) NOT NULL,
    condition VARCHAR(20) NOT NULL,
    location VARCHAR(120),
    status VARCHAR(24) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sold_at TIMESTAMPTZ
);

CREATE INDEX idx_listings_community_status ON listings (community_id, status);
CREATE INDEX idx_listings_seller ON listings (seller_id);
CREATE INDEX idx_listings_updated ON listings (updated_at DESC);

CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    storage_key VARCHAR(512) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings (id),
    buyer_id UUID NOT NULL REFERENCES users (id),
    seller_id UUID NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (listing_id, buyer_id)
);

CREATE INDEX idx_chats_buyer ON chats (buyer_id);
CREATE INDEX idx_chats_seller ON chats (seller_id);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats (id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users (id),
    body TEXT,
    image_key VARCHAR(512),
    system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_chat_created ON messages (chat_id, created_at);

CREATE TABLE message_reads (
    message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id),
    read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, user_id)
);

CREATE TABLE bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id),
    community_id UUID NOT NULL REFERENCES communities (id),
    ban_posting BOOLEAN NOT NULL DEFAULT FALSE,
    ban_chat BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL REFERENCES users (id),
    notified_expired BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bans_user_expires ON bans (user_id, expires_at);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users (id),
    reported_user_id UUID REFERENCES users (id),
    listing_id UUID REFERENCES listings (id),
    chat_id UUID REFERENCES chats (id),
    reason VARCHAR(40) NOT NULL,
    details TEXT,
    status VARCHAR(24) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ban_id UUID NOT NULL REFERENCES bans (id),
    user_id UUID NOT NULL REFERENCES users (id),
    message TEXT NOT NULL,
    evidence_key VARCHAR(512),
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES users (id),
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings (id),
    rater_id UUID NOT NULL REFERENCES users (id),
    ratee_id UUID NOT NULL REFERENCES users (id),
    stars INTEGER NOT NULL,
    review TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (listing_id, rater_id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    community_id UUID,
    event_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64),
    entity_id VARCHAR(64),
    metadata JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_event ON audit_logs (event_type);
