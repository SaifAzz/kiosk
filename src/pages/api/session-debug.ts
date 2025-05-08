import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Get the current session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Return the session data for debugging
    return res.status(200).json({
      session: {
        user: {
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
          countryId: session.user.countryId,
        },
      },
      headers: {
        cookie: req.headers.cookie,
      },
    });
  } catch (error: any) {
    console.error('Session debug error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 