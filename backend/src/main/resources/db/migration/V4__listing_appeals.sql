CREATE TABLE listing_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings (id),
    submitted_by UUID NOT NULL REFERENCES users (id),
    message TEXT NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES users (id),
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_appeals_listing ON listing_appeals (listing_id);
