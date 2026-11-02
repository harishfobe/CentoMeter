import React from "react";
import { Search } from "lucide-react";
export default function Empty({
  title,
  description,
  action,
  onAction,
  actionClassName = "secondary",
  as: Tag = "div",
  heading: Heading = "h3",
  icon: Icon = Search,
  className = "empty",
  ...props
}) {
  return (
    <Tag className={className} {...props}>
      {Icon && <Icon size={30} aria-hidden="true" />}
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
      {action && (
        <button className={actionClassName} onClick={onAction}>
          {action}
        </button>
      )}
    </Tag>
  );
}
