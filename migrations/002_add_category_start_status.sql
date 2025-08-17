ALTER TABLE auctions
    ADD COLUMN category TEXT,
    ADD COLUMN start_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN status TEXT CHECK (status IN ('pending','active','closed')) NOT NULL DEFAULT 'pending';
