import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createWorkflowSchema } from '@/lib/workflow/schemas';

// GET /api/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const objectType = searchParams.get('objectType') || '';

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (objectType) {
      where.objectType = objectType;
    }

    const [workflows, total] = await Promise.all([
      prisma.workflowDefinition.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              executions: true,
              enrollments: true,
            },
          },
        },
      }),
      prisma.workflowDefinition.count({ where }),
    ]);

    return NextResponse.json({
      data: workflows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // TODO: Get tenantId from authenticated user session
    const tenantId = body.tenantId || "demo-tenant";

    const workflow = await prisma.workflowDefinition.create({
      data: {
        tenantId,
        name: parsed.data.name,
        description: parsed.data.description,
        objectType: parsed.data.objectType,
        status: 'draft',
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
