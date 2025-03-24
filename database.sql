CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    marital_status ENUM('Single', 'Married') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professional_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    professional_status ENUM('employed', 'unemployed', 'self_employed', 'student') NOT NULL,
    profession VARCHAR(100),
    other_profession VARCHAR(100),
    workplace_name VARCHAR(100),
    position VARCHAR(100),
    experience_duration INT,
    university VARCHAR(100),
    other_university VARCHAR(100),
    current_level VARCHAR(50),
    nysc_status ENUM('completed', 'doing_nysc', 'exempted') NULL,
    state_of_posting VARCHAR(100),
    certifications TEXT,
    skills TEXT,
    is_available_for_support BOOLEAN DEFAULT FALSE,
    support_area VARCHAR(100),
    other_support_area VARCHAR(100),
    is_entrepreneur BOOLEAN DEFAULT FALSE,
    business_type VARCHAR(100),
    other_business_type VARCHAR(100),
    business_name VARCHAR(100),
    business_description TEXT,
    business_website VARCHAR(255),
    business_phone VARCHAR(20),
    business_email VARCHAR(100),
    business_address TEXT,
    business_registration_number VARCHAR(50),
    business_tin VARCHAR(50),
    business_incorporation_date DATE,
    business_industry VARCHAR(100),
    business_employees INT,
    business_revenue DECIMAL(15,2),
    business_challenges TEXT,
    business_goals TEXT,
    business_plan TEXT,
    business_plan_file VARCHAR(255),
    business_plan_file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE church_support (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    isAvailable BOOLEAN DEFAULT false,
    supportArea ENUM('career_coaching', 'legal_support', 'mentoring', 'church_worker', 'worship_team', 'children_ministry', 'youth_ministry', 'evangelism', 'prayer_warrior', 'technical_support', 'media_team', 'ushering', 'counseling', 'hospitality', 'outreach_coordinator') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE entrepreneurial_interests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    isInterested BOOLEAN DEFAULT false,
    businessType ENUM('Small Business Owner', 'Freelancer', 'Consultant', 'E-commerce Entrepreneur', 'Tech Startup Founder', 'Real Estate Investor', 'Franchise Owner', 'Service Provider', 'Digital Content Creator', 'Social Media Influencer', 'Online Educator', 'Health and Wellness Coach', 'Financial Advisor', 'Event Planner', 'Food and Beverage Entrepreneur') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id)
); 