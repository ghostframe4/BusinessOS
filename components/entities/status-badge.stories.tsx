import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatusBadge } from "@/components/entities/status-badge";
import type { Status } from "@/lib/content/schema";

/**
 * Badge de status no sistema "Flux". Escala do outline vazio ao limão
 * preenchido: empty < draft < in_progress < needs_review < validated;
 * archived fica esmaecido. validated = limão (check); needs_review = lavanda
 * pastel. O rótulo pt-BR está SEMPRE visível — cor/forma nunca é o único sinal.
 */
const meta = {
  title: "Entities/StatusBadge",
  component: StatusBadge,
  parameters: {
    layout: "centered",
  },
  args: {
    status: "draft",
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { status: "empty" },
};

export const Draft: Story = {
  args: { status: "draft" },
};

export const InProgress: Story = {
  args: { status: "in_progress" },
};

export const NeedsReview: Story = {
  args: { status: "needs_review" },
};

export const Validated: Story = {
  args: { status: "validated" },
};

export const Archived: Story = {
  args: { status: "archived" },
};

/** Galeria com toda a escala de status lado a lado (novo sistema Flux). */
export const AllStatuses: Story = {
  render: () => {
    const statuses: Status[] = [
      "empty",
      "draft",
      "in_progress",
      "needs_review",
      "validated",
      "archived",
    ];
    return (
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </div>
    );
  },
};
