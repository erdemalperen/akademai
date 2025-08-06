-- Konferans Eğitimleri tablosu
CREATE TABLE IF NOT EXISTS conference_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    location VARCHAR(255) NOT NULL, -- Konferans/toplantı konumu
    start_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Başlangıç tarihi ve saati
    end_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Bitiş tarihi ve saati
    capacity INTEGER DEFAULT 0, -- Maksimum katılımcı sayısı (0 = sınırsız)
    author VARCHAR(255),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Konferans Katılımcıları tablosu (konferans-kullanıcı ilişkisi)
CREATE TABLE IF NOT EXISTS conference_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES conference_trainings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT false, -- Gerçekten katıldı mı?
    attendance_time TIMESTAMP WITH TIME ZONE, -- Katılım zamanı (yoklama alındığında)
    notes TEXT, -- Ek notlar (katılımcı geri bildirimleri, vs.)
    UNIQUE(conference_id, user_id) -- Bir kullanıcı bir konferansa sadece bir kez kaydolabilir
);

-- Konferans İçerikleri tablosu (konferans materyalleri)
CREATE TABLE IF NOT EXISTS conference_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conference_id UUID NOT NULL REFERENCES conference_trainings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255), -- Dosya yolu (sunum, doküman, vb.)
    link VARCHAR(255), -- Harici link
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger fonksiyonu - konferans güncellendiğinde updated_at alanını günceller
CREATE OR REPLACE FUNCTION update_conference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conference_trainings_timestamp
BEFORE UPDATE ON conference_trainings
FOR EACH ROW
EXECUTE FUNCTION update_conference_timestamp();

-- Konferans katılımcı istatistikleri için view
CREATE OR REPLACE VIEW conference_statistics AS
SELECT 
    ct.id,
    ct.title,
    ct.start_date,
    ct.end_date,
    ct.capacity,
    COUNT(ca.id) AS total_registrations,
    SUM(CASE WHEN ca.attended THEN 1 ELSE 0 END) AS total_attendees,
    CASE 
        WHEN ct.capacity > 0 THEN 
            ROUND((COUNT(ca.id)::DECIMAL / ct.capacity) * 100, 2)
        ELSE 0
    END AS registration_percentage,
    CASE 
        WHEN COUNT(ca.id) > 0 THEN 
            ROUND((SUM(CASE WHEN ca.attended THEN 1 ELSE 0 END)::DECIMAL / COUNT(ca.id)) * 100, 2)
        ELSE 0
    END AS attendance_rate
FROM 
    conference_trainings ct
LEFT JOIN 
    conference_attendees ca ON ct.id = ca.conference_id
GROUP BY 
    ct.id, ct.title, ct.start_date, ct.end_date, ct.capacity;
