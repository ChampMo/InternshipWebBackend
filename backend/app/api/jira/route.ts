import { NextRequest, NextResponse } from 'next/server'
import { withCORS } from '@/lib/cors'
import clientPromise from '@/lib/mongodb'


export function OPTIONS() {
  return withCORS(NextResponse.json({}, { status: 200 }))
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






export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const BASE_URL = process.env.BASE_URL
    const USERNAME = process.env.USERNAME_JIRA

    if (!BASE_URL || !USERNAME || !userId) {
        throw new Error('BASE_URL, USERNAME, and userId must be defined');
    }
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    const users = db.collection('Users')
    const companies = db.collection('Companies')
    const tokens = db.collection('Tokens')

    const user = await users.findOne({ userId })
    if (!user) {
        return withCORS(NextResponse.json({ message: 'User not found' }, { status: 404 }))
    }
    
    const company = await companies.findOne({ companyId: user.companyId })
    if (!company) {
        return withCORS(NextResponse.json({ message: 'Company not found' }, { status: 404 }))
    }

    const jiraUrl = `${BASE_URL}/rest/api/3/search/jql?jql=project=${company?.companyKey}`

    const token = await tokens.findOne({ type: 'Jira', status:true })
    console.log('Jira token:', token)

    
    if (!token) {
        return withCORS(NextResponse.json({ message: 'Jira token not found' }, { status: 404 }))
    }
    if (token.expiryDate && new Date(token.expiryDate) < new Date()) {
        return withCORS(NextResponse.json({ message: 'Jira token has expired' }, { status: 401 }))
    }
    const auth = Buffer.from(`${USERNAME}:${token?.token}`).toString('base64')
    const response = await fetch(jiraUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
        }
    })
    if (!response.ok) {
        return withCORS(NextResponse.json({ message: 'Failed to fetch Jira issues' }, { status: response.status }))
    }

    const fieldUrl = `${BASE_URL}/rest/api/3/issue/createmeta?projectKeys=${company?.companyKey}&expand=projects.issuetypes.fields`

    const rawData = await response.json()

    // Fetch the field metadata
    const fieldResponse = await fetch(fieldUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json'
        }
    });
    if (!fieldResponse.ok) {
        return withCORS(NextResponse.json({ message: 'Failed to fetch Jira field metadata' }, { status: fieldResponse.status }))
    }
    const fieldData = await fieldResponse.json();
    const projectMeta = fieldData.projects?.[0];
    const formatted = formatJiraData(rawData.issues, projectMeta);

    return withCORS(NextResponse.json(formatted, { status: 200 }))
}
