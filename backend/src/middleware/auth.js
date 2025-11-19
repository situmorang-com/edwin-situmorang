import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({ error: 'No token provided' });
	}

	try {
		const user = jwt.verify(token, JWT_SECRET);
		req.user = user;
		next();
	} catch (error) {
		return res.status(403).json({ error: 'Invalid token' });
	}
}

export function generateToken(user) {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			name: user.name
		},
		JWT_SECRET,
		{ expiresIn: '30d' }
	);
}
