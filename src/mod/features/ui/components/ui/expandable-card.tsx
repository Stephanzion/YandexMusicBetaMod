import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@ui/components/ui/accordion";
import { cn } from "@ui/lib/utils";
import { useState } from "react";

export function ExpandableCard(props: {
  opened?: boolean | undefined;
  title: string;
  children: React.ReactNode;
  titleClassName?: string | undefined;
  contentClassName?: string | undefined;
  className?: string | undefined;
}) {
  const [value, setValue] = useState(Math.random().toString());

  return (
    <Accordion
      type="single"
      collapsible
      className={cn("m-3 flex flex-col gap-4 rounded-md px-3 bg-card", props.className)}
      defaultValue={props.opened ? value : undefined}
    >
      <AccordionItem value={value}>
        <AccordionTrigger
          className={cn(
            "hover:text-foreground/80 text-foreground text-md w-full font-semibold cursor-pointer",
            props.titleClassName,
          )}
        >
          {props.title}
        </AccordionTrigger>
        <AccordionContent className={cn("flex flex-col gap-4", props.contentClassName)}>
          {props.children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default ExpandableCard;
