-- 005_create_bootcamp_participants_table.sql

BEGIN;

CREATE TABLE IF NOT EXISTS bootcamp_participants (
    user_id INTEGER NOT NULL,
    bootcamp_id INTEGER NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Katılımcının ne zaman eklendiği (opsiyonel)

    PRIMARY KEY (user_id, bootcamp_id), -- Bir kullanıcı bir bootcamp'e sadece bir kez atanabilir

    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE, -- Kullanıcı silinirse, katılım kaydı da silinsin

    CONSTRAINT fk_bootcamp
        FOREIGN KEY(bootcamp_id)
        REFERENCES bootcamps(id)
        ON DELETE CASCADE -- Bootcamp silinirse, katılım kaydı da silinsin
);

-- İndeksler (Sorgu performansını artırmak için opsiyonel ama önerilir)
CREATE INDEX IF NOT EXISTS idx_bootcamp_participants_user_id ON bootcamp_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_bootcamp_participants_bootcamp_id ON bootcamp_participants(bootcamp_id);

COMMIT;
