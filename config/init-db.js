require('dotenv').config();
const db = require('./database');

async function initializeDatabase() {
    try {
        // Drop existing tables if they exist
        await db.query('DROP TABLE IF EXISTS entrepreneurial_interests');
        await db.query('DROP TABLE IF EXISTS church_support');
        await db.query('DROP TABLE IF EXISTS skills');
        await db.query('DROP TABLE IF EXISTS certifications');
        await db.query('DROP TABLE IF EXISTS professional_info');
        await db.query('DROP TABLE IF EXISTS emergency_contacts');
        await db.query('DROP TABLE IF EXISTS contact_info');
        await db.query('DROP TABLE IF EXISTS social_media_handles');
        await db.query('DROP TABLE IF EXISTS members');

        // Create members table with personal information
        await db.query(`
            CREATE TABLE IF NOT EXISTS members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firstName VARCHAR(50) NOT NULL,
                lastName VARCHAR(50) NOT NULL,
                dateOfBirth DATE NOT NULL,
                gender ENUM('Male', 'Female') NOT NULL,
                maritalStatus ENUM('Single', 'Married') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create social media handles table
        await db.query(`
            CREATE TABLE IF NOT EXISTS social_media_handles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                platform ENUM('Instagram', 'Twitter', 'TikTok') NOT NULL,
                handle VARCHAR(100) NOT NULL,
                FOREIGN KEY (member_id) REFERENCES members(id),
                UNIQUE KEY unique_member_platform (member_id, platform)
            )
        `);

        // Create contact information table
        await db.query(`
            CREATE TABLE IF NOT EXISTS contact_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                mobileNo VARCHAR(20) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                houseNo VARCHAR(50) NOT NULL,
                streetName VARCHAR(100) NOT NULL,
                country VARCHAR(100) NOT NULL,
                city VARCHAR(50),
                state VARCHAR(50),
                localGovt VARCHAR(50),
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        // Create emergency contact table
        await db.query(`
            CREATE TABLE IF NOT EXISTS emergency_contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                relationship VARCHAR(50) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        // Create professional information table
        await db.query(`
            CREATE TABLE IF NOT EXISTS professional_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                status ENUM('working', 'not_working', 'student', 'just_finished') NOT NULL,
                profession VARCHAR(100),
                workplaceName VARCHAR(100),
                position VARCHAR(100),
                experienceDuration INT,
                university VARCHAR(200),
                currentLevel VARCHAR(50),
                cvPath VARCHAR(255),
                nyscStatus ENUM('about_to_go', 'doing_nysc', 'about_to_finish'),
                stateOfPosting VARCHAR(50),
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        // Create certifications table
        await db.query(`
            CREATE TABLE IF NOT EXISTS certifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                certification_name VARCHAR(200) NOT NULL,
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        // Create skills table
        await db.query(`
            CREATE TABLE IF NOT EXISTS skills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                skill_name VARCHAR(100) NOT NULL,
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        // Create church support table
        await db.query(`
            CREATE TABLE IF NOT EXISTS church_support (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                isAvailable BOOLEAN NOT NULL DEFAULT FALSE,
                supportArea ENUM('career_coaching', 'legal_support', 'mentoring', 'church_worker', 'worship_team', 'children_ministry', 'youth_ministry', 'evangelism', 'prayer_warrior', 'technical_support', 'media_team', 'ushering', 'counseling', 'hospitality', 'outreach_coordinator'),
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        // Create entrepreneurial interests table
        await db.query(`
            CREATE TABLE IF NOT EXISTS entrepreneurial_interests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                member_id INT NOT NULL,
                isInterested BOOLEAN NOT NULL DEFAULT FALSE,
                businessType ENUM('Small Business Owner', 'Freelancer', 'Consultant', 'E-commerce Entrepreneur', 'Tech Startup Founder', 'Real Estate Investor', 'Franchise Owner', 'Service Provider', 'Digital Content Creator', 'Social Media Influencer', 'Online Educator', 'Health and Wellness Coach', 'Financial Advisor', 'Event Planner', 'Food and Beverage Entrepreneur'),
                FOREIGN KEY (member_id) REFERENCES members(id)
            )
        `);

        console.log('Database initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase(); 