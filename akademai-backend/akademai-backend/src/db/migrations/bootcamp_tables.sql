-- Bootcamp tablosu
CREATE TABLE IF NOT EXISTS bootcamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(255),
    author VARCHAR(255),
    published BOOLEAN DEFAULT false,
    duration INTEGER, -- Toplam tahmini süre (dakika)
    deadline DATE,    -- Son tamamlanma tarihi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bootcamp ve eğitimler arasındaki ilişki tablosu (sıralı)
CREATE TABLE IF NOT EXISTS bootcamp_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bootcamp_id UUID NOT NULL REFERENCES bootcamps(id) ON DELETE CASCADE,
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL, -- Eğitimlerin sırası
    required BOOLEAN DEFAULT true, -- Zorunlu mu?
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bootcamp_id, training_id), -- Bir eğitim bir bootcamp'e sadece bir kez eklenebilir
    UNIQUE(bootcamp_id, order_index) -- Bir bootcamp içinde her sıra numarası benzersiz olmalı
);

-- Kullanıcı bootcamp atamaları
CREATE TABLE IF NOT EXISTS user_bootcamp_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bootcamp_id UUID NOT NULL REFERENCES bootcamps(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, bootcamp_id) -- Bir kullanıcıya bir bootcamp sadece bir kez atanabilir
);

-- Bootcamp ilerleme durumu
CREATE TABLE IF NOT EXISTS bootcamp_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bootcamp_id UUID NOT NULL REFERENCES bootcamps(id) ON DELETE CASCADE,
    current_training_index INTEGER DEFAULT 0, -- Şu anda hangi eğitimde olduğu
    progress_percentage DECIMAL(5,2) DEFAULT 0.0, -- Genel ilerleme yüzdesi
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, bootcamp_id) -- Bir kullanıcının bir bootcamp için tek bir ilerleme kaydı olabilir
);

-- Trigger fonksiyonu - bootcamp güncellendiğinde updated_at alanını günceller
CREATE OR REPLACE FUNCTION update_bootcamp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bootcamp_timestamp
BEFORE UPDATE ON bootcamps
FOR EACH ROW
EXECUTE FUNCTION update_bootcamp_timestamp();
