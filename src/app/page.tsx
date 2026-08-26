import { DocumentWorkspace } from "@/features/documents/components/document-workspace";

// The route owns navigation only. The interactive workspace owns document UI
// state, while all persistence remains behind the document API/service boundary.
export default function Home() {
  return <DocumentWorkspace />;
}
