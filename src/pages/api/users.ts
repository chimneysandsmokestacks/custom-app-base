import { NextApiRequest, NextApiResponse } from 'next';
import { need } from '@/utils/need';

type SearchParams = { [key: string]: string | string[] | undefined };

async function loadCopilotSdk() {
  // Conditional import using require() for CommonJS compatibility
  try {
    const module = require('copilot-node-sdk');
    return module;
  } catch (e) {
    console.error('Failed to load copilot-node-sdk with require', e);
    throw new Error('Cannot load copilot-node-sdk');
  }
}

async function getSession(searchParams: SearchParams) {
  try {
    const { copilotApi } = await loadCopilotSdk();
    console.log('getSession: copilotApi imported successfully');

    const apiKey = need<string>(process.env.COPILOT_API_KEY);
    console.log('getSession: API key acquired:', apiKey);

    const copilot = copilotApi({
      apiKey: apiKey,
      token: 'token' in searchParams && typeof searchParams.token === 'string'
        ? searchParams.token
        : undefined,
    });
    console.log('getSession: Copilot API initialized:', copilot);

    const data: {
      workspace: Awaited<ReturnType<typeof copilot.retrieveWorkspace>>;
      client?: Awaited<ReturnType<typeof copilot.retrieveClient>>;
      company?: Awaited<ReturnType<typeof copilot.retrieveCompany>>;
      internalUser?: Awaited<ReturnType<typeof copilot.retrieveInternalUser>>;
    } = {
      workspace: await copilot.retrieveWorkspace(),
    };
    console.log('getSession: Workspace data retrieved:', data.workspace);

    const tokenPayload = await copilot.getTokenPayload?.();
    console.log('getSession: Token payload retrieved:', tokenPayload);

    if (tokenPayload?.clientId) {
      data.client = await copilot.retrieveClient({ id: tokenPayload.clientId });
      console.log('getSession: Client data retrieved:', data.client);
    }
    if (tokenPayload?.companyId) {
      data.company = await copilot.retrieveCompany({ id: tokenPayload.companyId });
      console.log('getSession: Company data retrieved:', data.company);
    }
    if (tokenPayload?.internalUserId) {
      data.internalUser = await copilot.retrieveInternalUser({ id: tokenPayload.internalUserId });
      console.log('getSession: Internal user data retrieved:', data.internalUser);
    }

    return data;
  } catch (error) {
    console.error('getSession: Error occurred:', error);
    throw error; // Re-throw the error after logging it
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('handler: Request received with query:', req.query);
    const searchParams = req.query;
    const sessionData = await getSession(searchParams as SearchParams);
    console.log('handler: Session data retrieved successfully:', sessionData);
    res.status(200).json(sessionData);
  } catch (error) {
    console.error('handler: Error fetching session data:', error);

    if (error instanceof Error) {
      res.status(500).json({ error: 'Failed to fetch session data', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch session data' });
    }
  }
}
