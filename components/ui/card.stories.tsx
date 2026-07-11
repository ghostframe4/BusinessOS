import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Card no design "Flux": cantos bem arredondados (rounded-3xl), sombra suave e
 * sem borda dura, sobre o canvas limao. Respiro generoso no header/content.
 */
const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Tese de valor</CardTitle>
        <CardDescription>Por que o cliente pagaria.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Rascunho pronto para revisao do founder.
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="brand" size="sm">
          Aprovar
        </Button>
        <Badge variant="brandMuted">needs_review</Badge>
      </CardFooter>
    </Card>
  ),
};
