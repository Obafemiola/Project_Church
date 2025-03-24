const express = require('express');
const router = express.Router();
const db = require('../config/database');
const xlsx = require('xlsx');

// Get all report data
router.get('/api/reports', async (req, res) => {
    try {
        console.log('Received report request with query:', req.query);
        const { startDate, endDate } = req.query;
        let dateFilter = '';
        let params = [];

        // First, let's get the total count without any date filter
        console.log('Fetching total members without date filter...');
        const [totalResultNoFilter] = await db.query('SELECT COUNT(*) as total FROM members');
        console.log('Total members without date filter:', totalResultNoFilter[0].total);

        if (startDate && endDate) {
            // Add time to the dates to include the full day
            const startDateTime = `${startDate} 00:00:00`;
            const endDateTime = `${endDate} 23:59:59`;
            dateFilter = 'WHERE m.created_at BETWEEN ? AND ?';
            params = [startDateTime, endDateTime];
            console.log('Applying date filter:', { startDateTime, endDateTime });
        }

        // Get total members with date filter
        console.log('Fetching total members with date filter...');
        const query = `SELECT COUNT(*) as total FROM members m ${dateFilter}`;
        console.log('Executing query:', query);
        console.log('With parameters:', params);
        
        const [totalResult] = await db.query(query, params);
        const totalMembers = totalResult[0].total;
        console.log('Total members with date filter:', totalMembers);

        // Get count of members with social media accounts
        console.log('Fetching members with social media accounts...');
        const [socialMediaResult] = await db.query(`
            SELECT COUNT(DISTINCT m.id) as total
            FROM members m
            JOIN social_media_handles sm ON m.id = sm.member_id
            ${dateFilter}
        `, params);
        const membersWithSocialMedia = socialMediaResult[0].total;
        console.log('Members with social media:', membersWithSocialMedia);

        // Get social media platform distribution
        console.log('Fetching social media platform distribution...');
        const [socialMediaPlatformStats] = await db.query(`
            SELECT 
                platform,
                COUNT(DISTINCT m.id) as count
            FROM members m
            JOIN social_media_handles sm ON m.id = sm.member_id
            ${dateFilter}
            GROUP BY platform
            ORDER BY count DESC
        `, params);
        console.log('Social media platform stats:', socialMediaPlatformStats);

        // Get gender distribution
        console.log('Fetching gender distribution...');
        const [genderStats] = await db.query(`
            SELECT m.gender, COUNT(*) as count 
            FROM members m ${dateFilter}
            GROUP BY m.gender
        `, params);
        console.log('Gender stats:', genderStats);

        // Get marital status distribution
        console.log('Fetching marital status distribution...');
        const [maritalStatusStats] = await db.query(`
            SELECT m.Maritalstatus as marital_status, COUNT(*) as count 
            FROM members m ${dateFilter}
            GROUP BY m.Maritalstatus
        `, params);
        console.log('Marital status stats:', maritalStatusStats);

        // Get professional status distribution
        console.log('Fetching professional status distribution...');
        const [professionalStatusStats] = await db.query(`
            SELECT pi.status as professional_status, COUNT(*) as count 
            FROM members m
            JOIN professional_info pi ON m.id = pi.member_id
            ${dateFilter}
            GROUP BY pi.status
            ORDER BY count DESC
        `, params);
        console.log('Professional status stats:', professionalStatusStats);

        // Get profession distribution for working members
        console.log('Fetching profession distribution for working members...');
        const [professionStats] = await db.query(`
            SELECT pi.profession, COUNT(*) as count 
            FROM members m
            JOIN professional_info pi ON m.id = pi.member_id
            ${dateFilter}
            AND pi.status = 'working'
            GROUP BY pi.profession
            ORDER BY count DESC
        `, params);
        console.log('Profession stats:', professionStats);

        // Get NYSC status distribution for just_finished members
        console.log('Fetching NYSC status distribution...');
        const [nyscStats] = await db.query(`
            SELECT pi.nyscstatus, COUNT(*) as count 
            FROM members m
            JOIN professional_info pi ON m.id = pi.member_id
            ${dateFilter}
            AND pi.status = 'just_finished'
            GROUP BY pi.nyscstatus
            ORDER BY count DESC
        `, params);
        console.log('NYSC stats:', nyscStats);

        // Get university distribution for students
        console.log('Fetching university distribution...');
        const [universityStats] = await db.query(`
            SELECT pi.university, COUNT(*) as count 
            FROM members m
            JOIN professional_info pi ON m.id = pi.member_id
            ${dateFilter}
            AND pi.status = 'student'
            GROUP BY pi.university
            ORDER BY count DESC
        `, params);
        console.log('University stats:', universityStats);

        // Get state posting distribution for NYSC members
        console.log('Fetching state posting distribution...');
        const [statePostingStats] = await db.query(`
            SELECT pi.stateofposting as state_posting, COUNT(*) as count 
            FROM members m
            JOIN professional_info pi ON m.id = pi.member_id
            ${dateFilter}
            AND pi.nyscstatus = 'doing_nysc'
            GROUP BY pi.stateofposting
            ORDER BY count DESC
        `, params);
        console.log('State posting stats:', statePostingStats);

        const response = {
            totalMembers,
            membersWithSocialMedia,
            socialMediaPlatformStats,
            genderStats,
            maritalStatusStats,
            professionalStatusStats,
            statePostingStats,
            subReports: {
                working: professionStats,
                just_finished: nyscStats,
                student: universityStats
            }
        };
        console.log('Sending response:', response);
        res.json(response);
    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch report data: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Add new route for Excel export
router.get('/api/reports/export', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log('Exporting report data with query:', { startDate, endDate });

        // Create a new workbook
        const workbook = xlsx.utils.book_new();

        // Get all the data we need
        const [
            totalMembersResult,
            membersWithSocialMediaResult,
            socialMediaPlatformStats,
            genderStats,
            maritalStatusStats,
            professionalStatusStats,
            professionStats,
            nyscStats,
            statePostingStats,
            membersData
        ] = await Promise.all([
            // Total members count
            db.query('SELECT COUNT(*) as total FROM members m'),
            // Members with social media
            db.query(`
                SELECT COUNT(DISTINCT m.id) as total
                FROM members m
                JOIN social_media_handles sm ON m.id = sm.member_id
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // Social media platform stats
            db.query(`
                SELECT 
                    platform,
                    COUNT(DISTINCT m.id) as count
                FROM members m
                JOIN social_media_handles sm ON m.id = sm.member_id
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
                GROUP BY platform
                ORDER BY count DESC
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // Gender stats
            db.query(`
                SELECT 
                    gender,
                    COUNT(*) as count
                FROM members m
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
                GROUP BY gender
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // Marital status stats
            db.query(`
                SELECT 
                    Maritalstatus as marital_status,
                    COUNT(*) as count
                FROM members m
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
                GROUP BY Maritalstatus
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // Professional status stats
            db.query(`
                SELECT 
                    status as professional_status,
                    COUNT(*) as count
                FROM members m
                JOIN professional_info pi ON m.id = pi.member_id
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
                GROUP BY status
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // Profession stats
            db.query(`
                SELECT 
                    profession,
                    COUNT(*) as count
                FROM members m
                JOIN professional_info pi ON m.id = pi.member_id
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
                AND pi.status = 'working'
                GROUP BY profession
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // NYSC stats
            db.query(`
                SELECT 
                    nyscstatus as nysc_status,
                    COUNT(*) as count
                FROM members m
                JOIN professional_info pi ON m.id = pi.member_id
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
                AND pi.status = 'just_finished'
                GROUP BY nyscstatus
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // State posting stats
            db.query(`
                SELECT 
                    stateofposting as state_posting,
                    COUNT(*) as count
                FROM members m
                JOIN professional_info pi ON m.id = pi.member_id
                WHERE pi.nyscstatus = 'doing_nysc'
                ${startDate && endDate ? 'AND m.created_at BETWEEN ? AND ?' : ''}
                GROUP BY stateofposting
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : []),
            // All members data
            db.query(`
                SELECT 
                    m.id,
                    ANY_VALUE(m.firstname) as firstname,
                    ANY_VALUE(m.lastname) as lastname,
                    ANY_VALUE(m.email) as email,
                    ANY_VALUE(m.phone) as phone,
                    ANY_VALUE(m.gender) as gender,
                    ANY_VALUE(m.Maritalstatus) as Maritalstatus,
                    ANY_VALUE(m.created_at) as created_at,
                    ANY_VALUE(pi.status) as professional_status,
                    ANY_VALUE(pi.profession) as profession,
                    ANY_VALUE(pi.nyscstatus) as nysc_status,
                    ANY_VALUE(pi.stateofposting) as state_posting,
                    GROUP_CONCAT(DISTINCT sm.platform) as social_media_platforms
                FROM members m
                LEFT JOIN professional_info pi ON m.id = pi.member_id
                LEFT JOIN social_media_handles sm ON m.id = sm.member_id
                ${startDate && endDate ? 'WHERE m.created_at BETWEEN ? AND ?' : ''}
                GROUP BY m.id
                ORDER BY m.created_at DESC
            `, startDate && endDate ? [startDate + ' 00:00:00', endDate + ' 23:59:59'] : [])
        ]);

        // Create Dashboard sheet
        const dashboardData = [
            ['Report Summary'],
            [''],
            ['Total Members', totalMembersResult[0].total],
            ['Members with Social Media', membersWithSocialMediaResult[0].total],
            [''],
            ['Gender Distribution'],
            ['Gender', 'Count'],
            ...genderStats.map(stat => [stat.gender, stat.count]),
            [''],
            ['Marital Status Distribution'],
            ['Status', 'Count'],
            ...maritalStatusStats.map(stat => [stat.marital_status, stat.count]),
            [''],
            ['Professional Status Distribution'],
            ['Status', 'Count'],
            ...professionalStatusStats.map(stat => [stat.professional_status, stat.count]),
            [''],
            ['Profession Distribution'],
            ['Profession', 'Count'],
            ...professionStats.map(stat => [stat.profession, stat.count]),
            [''],
            ['NYSC Status Distribution'],
            ['Status', 'Count'],
            ...nyscStats.map(stat => [stat.nysc_status, stat.count]),
            [''],
            ['State Posting Distribution (NYSC)'],
            ['State', 'Count'],
            ...statePostingStats.map(stat => [stat.state_posting, stat.count]),
            [''],
            ['Social Media Platform Distribution'],
            ['Platform', 'Count'],
            ...socialMediaPlatformStats.map(stat => [stat.platform, stat.count])
        ];

        const dashboardSheet = xlsx.utils.aoa_to_sheet(dashboardData);
        xlsx.utils.book_append_sheet(workbook, dashboardSheet, 'Dashboard');

        // Create Members sheet
        const membersDataFormatted = membersData.map(member => ({
            'ID': member.id,
            'First Name': member.firstname,
            'Last Name': member.lastname,
            'Email': member.email,
            'Phone': member.phone,
            'Gender': member.gender,
            'Marital Status': member.Maritalstatus,
            'Professional Status': member.professional_status,
            'Profession': member.profession,
            'NYSC Status': member.nysc_status,
            'State Posting': member.state_posting,
            'Social Media Platforms': member.social_media_platforms,
            'Created At': new Date(member.created_at).toLocaleString()
        }));

        const membersSheet = xlsx.utils.json_to_sheet(membersDataFormatted);
        xlsx.utils.book_append_sheet(workbook, membersSheet, 'Members');

        // Generate Excel file
        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=member_report.xlsx');

        // Send the Excel file
        res.send(excelBuffer);

    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ error: 'Failed to export report' });
    }
});

module.exports = router; 