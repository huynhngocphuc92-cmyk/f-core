import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateWorkflowSchema } from '@/lib/workflow/schemas';

// GET /api/workflows/[id] - Get single workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const workflow = await prisma.workflowDefinition.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            executions: true,
            enrollments: true,
          },
        },
      },
    });

    if (!workflow || workflow.deletedAt) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

// PUT /api/workflows/[id] - Update workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateWorkflowSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.workflowDefinition.findUnique({
      where: { id },
      select: { deletedAt: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.triggerConfig !== undefined) data.triggerConfig = parsed.data.triggerConfig;
    if (parsed.data.steps !== undefined) data.steps = parsed.data.steps;
    if (parsed.data.viewport !== undefined) data.viewport = parsed.data.viewport;
    if (parsed.data.settings !== undefined) data.settings = parsed.data.settings;

    const workflow = await prisma.workflowDefinition.update({
      where: { id },
      data,
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - Soft delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.workflowDefinition.findUnique({
      where: { id },
      select: { deletedAt: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    await prisma.workflowDefinition.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'archived',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}

// PATCH /api/workflows/[id] - Toggle status (activate/deactivate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['active', 'paused', 'draft'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be active, paused, or draft.' },
        { status: 400 }
      );
    }

    const existing = await prisma.workflowDefinition.findUnique({
      where: { id },
      select: { deletedAt: true },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const workflow = await prisma.workflowDefinition.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error updating workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow status' },
      { status: 500 }
    );
  }
}
