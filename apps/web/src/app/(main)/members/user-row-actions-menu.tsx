"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type UserRole = "USER" | "TESTER" | "ADMIN";

export function UserRowActionsMenu({
  userId,
  currentRole,
  disabled,
  onChangeRole,
}: {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
  onChangeRole: (role: UserRole) => void;
}) {
  const roleItems: Array<{ value: UserRole; label: string }> = [
    { value: "USER", label: "Set role: User" },
    { value: "TESTER", label: "Set role: Tester" },
    { value: "ADMIN", label: "Set role: Admin" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="User actions"
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          className="h-8 w-8 rounded-md"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[188px] p-1" align="end">
        <PopoverClose asChild>
          <Link
            href={`/admin/users/${userId}#edit-section`}
            onClick={(event) => event.stopPropagation()}
            className="block rounded-md px-2.5 py-2 text-sm hover:bg-accent"
          >
            Edit
          </Link>
        </PopoverClose>
        <div className="my-1 h-px bg-border/70" />
        {roleItems.map((item) => (
          <PopoverClose asChild key={item.value}>
            <button
              type="button"
              disabled={disabled || currentRole === item.value}
              onClick={(event) => {
                event.stopPropagation();
                onChangeRole(item.value);
              }}
              className={cn(
                "block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent",
                currentRole === item.value && "text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          </PopoverClose>
        ))}
      </PopoverContent>
    </Popover>
  );
}
