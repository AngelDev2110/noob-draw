import { Field, FieldLabel, FieldDescription } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { changeDisplayName } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";
import { Save, LoaderCircle } from "lucide-react";

function baseName(displayName: string | undefined) {
  return displayName?.replace(/#\d+$/, "") ?? "";
}

export function UsernameField() {
  const { user } = useAuth() || {};
  const [name, setName] = useState(() =>
    baseName(user?.user_metadata?.display_name),
  );

  const nameMutation = useMutation({
    mutationFn: (displayName: string) => changeDisplayName(displayName),
  });

  const feedback = nameMutation.isError
    ? nameMutation.error.message
    : nameMutation.isSuccess
      ? `Saved as ${nameMutation.data.user?.user_metadata?.display_name}!`
      : name.trim().length < 3
        ? "Name must be at least 3 characters"
        : "Looks good!";

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
            onChange={(e) => {
              setName(e.target.value);
              nameMutation.reset();
            }}
          />
          <FieldDescription
            className={
              nameMutation.isError
                ? "text-xs text-destructive"
                : nameMutation.isSuccess
                  ? "text-xs text-primary"
                  : "text-xs text-muted-foreground"
            }
          >
            {feedback}
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
