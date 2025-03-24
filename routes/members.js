const express = require('express');
const router = express.Router();
const db = require('../config/database');
const path = require('path');

// Register new member
router.post('/register', async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Get form fields from req.body
        const formData = req.body;
        
        // Debug logging of raw request
        console.log('Raw request body:', req.body);
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('Files:', req.files);
        
        // Basic validation with detailed error messages
        const requiredFields = {
            // Personal Information
            firstName: 'First Name',
            lastName: 'Last Name',
            dateOfBirth: 'Date of Birth',
            gender: 'Gender',
            maritalStatus: 'Marital Status',
            
            // Contact Information
            mobileNo: 'Mobile Number',
            email: 'Email',
            houseNo: 'House Number',
            streetName: 'Street Name',
            country: 'Country of Residence',
            
            // Emergency Contact
            emergencyName: 'Emergency Contact Name',
            emergencyRelationship: 'Emergency Contact Relationship',
            emergencyPhone: 'Emergency Contact Phone Number',
            
            // Professional Status
            professionalStatus: 'Professional Status'
        };

        // Add state and LGA validation only for Nigeria
        if (formData.country === 'Nigeria') {
            Object.assign(requiredFields, {
                state: 'State',
                localGovt: 'Local Government Area'
            });
        }

        // Additional required fields based on professional status
        if (formData.professionalStatus === 'working') {
            Object.assign(requiredFields, {
                profession: 'Profession',
                workplaceName: 'Workplace Name',
                position: 'Position',
                experienceDuration: 'Experience Duration'
            });
        } else if (formData.professionalStatus === 'student') {
            Object.assign(requiredFields, {
                university: 'University/Institution',
                currentLevel: 'Current Level'
            });
        } else if (formData.professionalStatus === 'just_finished') {
            Object.assign(requiredFields, {
                nyscStatus: 'NYSC Status'
            });
            // Add state of posting validation for doing_nysc
            if (formData.nyscStatus === 'doing_nysc') {
                Object.assign(requiredFields, {
                    stateOfPosting: 'State of Posting'
                });
            }
        } else if (formData.professionalStatus === 'not_working' && (!req.files || !req.files.cvUpload)) {
            return res.status(400).json({ 
                error: 'CV file is required for not working status',
                validationErrors: [{ message: 'CV file is required' }]
            });
        }

        // Debug: Log all required fields
        console.log('Required fields:', requiredFields);

        const missingFields = [];
        for (const [field, label] of Object.entries(requiredFields)) {
            const value = formData[field];
            console.log(`Checking field ${field}:`, { 
                value, 
                type: typeof value, 
                isUndefined: value === undefined,
                isNull: value === null,
                isEmpty: value === '',
                isEmptyString: typeof value === 'string' && value.trim() === '',
                isEmptyArray: Array.isArray(value) && value.length === 0
            });

            if (value === undefined || value === null || value === '' || 
                (typeof value === 'string' && value.trim() === '') ||
                (Array.isArray(value) && value.length === 0)) {
                missingFields.push(`${label} is required`);
                console.log(`Field ${field} is missing or empty`);
            }
        }

        if (missingFields.length > 0) {
            console.log('Validation failed. Missing fields:', missingFields);
            return res.status(400).json({ 
                error: 'Required fields are missing',
                validationErrors: missingFields.map(msg => ({ message: msg }))
            });
        }

        // Log successful validation
        console.log('All required fields are present');

        // Check if email already exists
        const [existingUsers] = await conn.query('SELECT id FROM contact_info WHERE email = ?', [formData.email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Handle file upload for CV if status is not_working
        let cvPath = null;
        if (formData.professionalStatus === 'not_working') {
            if (!req.files || !req.files.cvUpload) {
                return res.status(400).json({ error: 'CV file is required for not working status' });
            }

            const cvFile = req.files.cvUpload;
            const fileExt = path.extname(cvFile.name).toLowerCase();
            const allowedExtensions = ['.pdf', '.doc', '.docx'];

            if (!allowedExtensions.includes(fileExt)) {
                return res.status(400).json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' });
            }

            const uniqueFilename = `${Date.now()}-${cvFile.name}`;
            cvPath = path.join('uploads', 'cvs', uniqueFilename);
            
            try {
                await cvFile.mv(path.join(__dirname, '..', cvPath));
            } catch (error) {
                console.error('File upload error:', error);
                return res.status(500).json({ error: 'Failed to upload CV file' });
            }
        }

        try {
            // Insert member basic info
            const [memberResult] = await conn.query(
                'INSERT INTO members (firstName, lastName, dateOfBirth, gender, maritalStatus) VALUES (?, ?, ?, ?, ?)',
                [
                    String(formData.firstName).trim(),
                    String(formData.lastName).trim(),
                    formData.dateOfBirth,
                    String(formData.gender).trim(),
                    String(formData.maritalStatus).trim()
                ]
            );
            const memberId = memberResult.insertId;

            // Insert social media handles
            const platforms = ['instagram', 'twitter', 'tiktok'];
            for (const platform of platforms) {
                const handle = formData[`${platform}Handle`];
                const isChecked = formData[platform] === 'on';
                
                console.log(`Processing ${platform}:`, {
                    handle,
                    isChecked,
                    rawValue: formData[platform]
                });

                if (isChecked && handle && handle.trim()) {
                    await conn.query(
                        'INSERT INTO social_media_handles (member_id, platform, handle) VALUES (?, ?, ?)',
                        [memberId, platform, handle.trim()]
                    );
                }
            }

            // Insert contact information
            await conn.query(
                'INSERT INTO contact_info (member_id, mobileNo, email, houseNo, streetName, city, state, localGovt, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    memberId, 
                    String(formData.mobileNo).trim(), 
                    String(formData.email).trim(), 
                    String(formData.houseNo).trim(), 
                    String(formData.streetName).trim(), 
                    String(formData.city || '').trim() || null,
                    String(formData.state || '').trim() || null,
                    String(formData.localGovt || '').trim() || null,
                    String(formData.country).trim()
                ]
            );

            // Insert emergency contact
            await conn.query(
                'INSERT INTO emergency_contacts (member_id, name, relationship, phone) VALUES (?, ?, ?, ?)',
                [
                    memberId, 
                    String(formData.emergencyName).trim(), 
                    String(formData.emergencyRelationship).trim(), 
                    String(formData.emergencyPhone).trim()
                ]
            );

            // Insert into professional_info table
            const professionalInfoQuery = `
                INSERT INTO professional_info (
                    member_id, status, profession, workplaceName, position, 
                    experienceDuration, university, currentLevel, cvPath, 
                    nyscStatus, stateOfPosting
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const professionalInfoValues = [
                memberId,
                formData.professionalStatus,
                formData.profession || null,
                formData.workplaceName || null,
                formData.position || null,
                formData.experienceDuration || null,
                formData.university || null,
                formData.currentLevel || null,
                formData.cvPath || null,
                formData.nyscStatus || null,
                formData.stateOfPosting || null
            ];

            await conn.query(professionalInfoQuery, professionalInfoValues);

            // Insert certifications
            if (formData.certifications) {
                const certifications = String(formData.certifications)
                    .split(',')
                    .map(cert => cert.trim())
                    .filter(cert => cert.length > 0);

                console.log('Processing certifications:', certifications);

                for (const cert of certifications) {
                    await conn.query(
                        'INSERT INTO certifications (member_id, certification_name) VALUES (?, ?)',
                        [memberId, cert]
                    );
                }
            }

            // Insert skills
            if (formData.skills) {
                const skills = String(formData.skills)
                    .split(',')
                    .map(skill => skill.trim())
                    .filter(skill => skill.length > 0);

                console.log('Processing skills:', skills);

                for (const skill of skills) {
                    await conn.query(
                        'INSERT INTO skills (member_id, skill_name) VALUES (?, ?)',
                        [memberId, skill]
                    );
                }
            }

            // Insert church support information
            if (formData.isAvailableForSupport) {
                await conn.query(
                    'INSERT INTO church_support (member_id, isAvailable, supportArea) VALUES (?, ?, ?)',
                    [
                        memberId, 
                        true, 
                        formData.supportArea || null
                    ]
                );
            }

            // Insert entrepreneurial interests
            if (formData.isEntrepreneur) {
                await conn.query(
                    'INSERT INTO entrepreneurial_interests (member_id, isInterested, businessType) VALUES (?, ?, ?)',
                    [
                        memberId, 
                        true, 
                        formData.businessType || null
                    ]
                );
            }

            await conn.commit();
            res.status(201).json({
                message: 'Registration successful',
                memberId: memberId
            });
        } catch (error) {
            await conn.rollback();
            console.error('Database error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_BAD_NULL_ERROR') {
                const fieldName = error.sqlMessage.match(/Column '(.+)' cannot be null/)[1];
                return res.status(400).json({ 
                    error: `${fieldName} cannot be empty`,
                    validationErrors: [{ message: `${fieldName} is required` }]
                });
            }
            
            res.status(500).json({ 
                error: 'Failed to save registration information. Please try again.',
                details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
            });
        }
    } catch (error) {
        await conn.rollback();
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'An unexpected error occurred. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    } finally {
        conn.release();
    }
});

module.exports = router;