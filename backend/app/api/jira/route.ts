import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function OPTIONS(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 })
  // echo headers ที่ client ขอมา (กัน preflight ตกเพราะ header แปลกๆ)
  const acrh = req.headers.get('access-control-request-headers')
  if (acrh) res.headers.set('Access-Control-Allow-Headers', acrh)
  return withCORS(res, req.headers.get('origin') ?? undefined)
}

interface JiraProject {
    name?: string;
}

interface JiraPriority {
    name?: string;
}

interface JiraStatus {
    name?: string;
}

interface JiraCreator {
    displayName?: string;
}

interface JiraFields {
    project?: JiraProject;
    created?: string;
    priority?: JiraPriority;
    updated?: string;
    status?: JiraStatus;
    summary?: string;
    creator?: JiraCreator;
    [key: string]: any; // for customfields and other dynamic fields
}

interface JiraIssue {
    key: string;
    fields: JiraFields;
}

interface FormattedJiraIssue {
    key: string;
    projectName: string | null;
    created?: string;
    priority: string | null;
    updated?: string;
    status: string | null;
    summary?: string;
    creator: string | null;
    [key: string]: any; // for customfields
}

const formatJiraData = (issues: JiraIssue[], projectMeta: any): FormattedJiraIssue[] => {
  return issues.map(issue => {
    const { key, fields } = issue;
    const issuetypeId = fields.issuetype?.id;
    const issuetypeMeta = projectMeta.issuetypes?.find((it: any) => it.id === issuetypeId);
    const fieldMeta = issuetypeMeta?.fields || {};

    const customFields = Object.entries(fields)
      .filter(([k, v]) => k.startsWith('customfield_') && v !== null)
      .map(([fieldKey, value]) => {
        const meta = fieldMeta[fieldKey];
        return {
          fieldKey,
          fieldName: meta?.name || fieldKey,
          value,
        };
      });

    return {
      key,
      projectName: fields.project?.name ?? null,
      created: fields.created,
      priority: fields.priority?.name ?? null,
      updated: fields.updated,
      status: fields.status?.name ?? null,
      summary: fields.summary,
      creator: fields.creator?.displayName ?? null,
      customFields,
    };
  });
};







export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const BASE_URL = process.env.BASE_URL
    const USERNAME = process.env.USERNAME_JIRA
    const DB_NAME = process.env.MONGODB_DB

    if (!BASE_URL || !USERNAME || !DB_NAME) {
      return withCORS(
        NextResponse.json({ message: 'Missing env: BASE_URL/USERNAME_JIRA/MONGODB_DB' }, { status: 500 }),
        req.headers.get('origin') ?? undefined
      )
    }
    if (!userId) {
      return withCORS(
        NextResponse.json({ message: 'userId is required' }, { status: 400 }),
        req.headers.get('origin') ?? undefined
      )
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection('Users')
    const companies = db.collection('Companies')
    const tokens = db.collection('Tokens')

    const user = await users.findOne({ userId })
    if (!user) {
      return withCORS(NextResponse.json({ message: 'User not found' }, { status: 404 }), req.headers.get('origin') ?? undefined)
    }

    const company = await companies.findOne({ companyId: user.companyId })
    if (!company) {
      return withCORS(NextResponse.json({ message: 'Company not found' }, { status: 404 }), req.headers.get('origin') ?? undefined)
    }

    const token = await tokens.findOne({ type: 'Jira', status: true })
    if (!token) {
      return withCORS(NextResponse.json({ message: 'Jira token not found' }, { status: 404 }), req.headers.get('origin') ?? undefined)
    }
    if (token.expiryDate && new Date(token.expiryDate) < new Date()) {
      return withCORS(NextResponse.json({ message: 'Jira token has expired' }, { status: 401 }), req.headers.get('origin') ?? undefined)
    }

    const jiraUrl = `${BASE_URL}/rest/api/3/search/jql?jql=project=${company.companyKey}`
    const auth = Buffer.from(`${USERNAME}:${token.token}`).toString('base64')

    const response = await fetch(jiraUrl, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
    })
    if (!response.ok) {
      return withCORS(
        NextResponse.json({ message: 'Failed to fetch Jira issues' }, { status: response.status }),
        req.headers.get('origin') ?? undefined
      )
    }

    const rawData = await response.json()

    const fieldUrl = `${BASE_URL}/rest/api/3/issue/createmeta?projectKeys=${company.companyKey}&expand=projects.issuetypes.fields`
    const fieldResponse = await fetch(fieldUrl, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}`, 'Accept': 'application/json' }
    })
    if (!fieldResponse.ok) {
      return withCORS(
        NextResponse.json({ message: 'Failed to fetch Jira field metadata' }, { status: fieldResponse.status }),
        req.headers.get('origin') ?? undefined
      )
    }

    const fieldData = await fieldResponse.json()
    const projectMeta = fieldData.projects?.[0]

    // ---- formatter เดิมของคุณ ----
    const formatted = formatJiraData(rawData.issues, projectMeta)

    return withCORS(NextResponse.json(formatted, { status: 200 }), req.headers.get('origin') ?? undefined)
  } catch (err: any) {
    // สำคัญ: error ก็ต้องติด CORS เสมอ
    return withCORS(
      NextResponse.json({ message: 'Internal error', detail: err?.message ?? String(err) }, { status: 500 }),
      req.headers.get('origin') ?? undefined
    )
  }
}
