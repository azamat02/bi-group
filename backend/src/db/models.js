const pool = require("./index");

const checkUser = async (userData) => {
    const { userId, firstName, username, languageCode, profileImageId } = userData

    // Ensure the client exists in the database
    const clientRes = await pool.query('SELECT id FROM clients WHERE user_id = $1', [userId]);
    let clientId;
    if (clientRes.rows.length === 0) {
        // Insert new client if it doesn't exist
        const insertClientText = `
                INSERT INTO clients(user_id, first_name, username, language_code, profile_image_id)
                VALUES($1, $2, $3, $4, $5)
                RETURNING id;
            `;
        const newClientRes = await pool.query(insertClientText, [userId, firstName, username, languageCode, profileImageId]);
        clientId = newClientRes.rows[0].id;
    } else {
        clientId = clientRes.rows[0].id;
    }
    return clientId
}

const saveMessage = async (userData, message, fromConsultant, client_id) => {
    try {
        // Insert the message
        const insertMessageText = `
                INSERT INTO messages(client_id, message, from_consultant)
                VALUES($1, $2, $3) returning id;
            `;

        let finalClientId

        if (fromConsultant) {
            finalClientId = client_id
        } else {
            finalClientId = await checkUser(userData)
        }

        return await pool.query(insertMessageText, [finalClientId, message, fromConsultant]);
    } catch (err) {
        console.error('Database error:', err);
    }
}

module.exports = {saveMessage}