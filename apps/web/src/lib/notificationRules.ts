export function shouldNotifyOwnerOnComment(
  issueOwnerId: string,
  commentAuthorId: string,
): boolean {
  return issueOwnerId !== commentAuthorId;
}

export function buildCommentNotificationMessage(issueTitle: string): string {
  const title = issueTitle.trim() || "your issue";
  return `New comment on "${title}".`;
}
