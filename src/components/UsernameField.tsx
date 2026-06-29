import { Field, FieldLabel, FieldDescription } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { changeDisplayName } from "@/services/auth";
import { Save, LoaderCircle } from "lucide-react";

export function UsernameField() {
  const [name, setName] = useState("");
  const nameMutation = useMutation({
    mutationFn: (displayName: string) => changeDisplayName(displayName),
  });

  return (
    <Field>
      <FieldLabel htmlFor="name">Display Name</FieldLabel>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 flex-1">
          <Input
            id="name"
            placeholder="Top 1° Noobie"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
          />
          <FieldDescription className="text-xs text-muted-foreground">
            {name.trim().length < 3
              ? "Name must be at least 3 characters"
              : "Looks good!"}
          </FieldDescription>
        </div>
        <Button
          variant="secondary"
          onClick={() => nameMutation.mutate(name.trim())}
          disabled={name.trim().length < 3 || nameMutation.isPending}
        >
          {nameMutation.isPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Save />
          )}
        </Button>
      </div>
    </Field>
  );
}
