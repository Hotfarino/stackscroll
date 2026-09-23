export type Topic = "Networking" | "CompTIA" | "CCNA" | "Cloud" | "Development" | "Languages" | "Agentic AI" | "Machine learning" | "AI workflows" | "Data centers" | "Cybersecurity" | "Data engineering" | "DevOps" | "Web & accessibility" | "Mobile development" | "Robotics & IoT";
export type Kind = "lesson" | "quiz" | "flashcard" | "news" | "video" | "quote" | "explainer" | "story" | "podcast" | "resource" | "humor";
export type CatalogMetadata = {
  edition: "launch-1000";
  delivery: "source" | "native";
  format: "guide" | "reference" | "article" | "repository" | "podcast" | "video" | "humor" | "practice";
  checkedAt: string;
  review: "publisher-linked" | "original-review-pending" | "original-humor";
  rights: "link-only" | "original";
  tags: string[];
  prompt?: string;
  excerpt?: string;
};
export type Card = {
  id: string; kind: Kind; topic: Topic; title: string; level: "Foundation" | "Intermediate" | "Advanced";
  body?: string; takeaway?: string; code?: string; language?: string; visual?: "network" | "subnet" | "workflow";
  options?: string[]; answer?: number; explanation?: string; back?: string;
  source: string; sourceName: string; date?: string; minutes?: number; catalog?: CatalogMetadata; newsImage?: string;
};
export const topics: Topic[] = ["Networking", "CompTIA", "CCNA", "Cloud", "Development", "Languages", "Agentic AI", "Machine learning", "AI workflows", "Data centers", "Cybersecurity", "Data engineering", "DevOps", "Web & accessibility", "Mobile development", "Robotics & IoT"];
const refs = {
  network: ["https://www.rfc-editor.org/rfc/rfc826", "IETF · ARP"],
  subnet: ["https://www.rfc-editor.org/rfc/rfc4632", "IETF · CIDR"],
  cisco: ["https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf", "Cisco · CCNA objectives"],
  aws: ["https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Security.html", "AWS · VPC documentation"],
  python: ["https://docs.python.org/3/tutorial/datastructures.html", "Python documentation"],
  ml: ["https://developers.google.com/machine-learning/crash-course/overfitting", "Google · ML Crash Course"],
  agent: ["https://www.anthropic.com/engineering/building-effective-agents", "Anthropic · Engineering"],
};
function c(data: Omit<Card,"source"|"sourceName">, ref: string[]): Card {return {...data,source:ref[0],sourceName:ref[1]};}
export const coreCards: Card[] = [
 c({id:"dc-airflow",kind:"lesson",topic:"Data centers",level:"Foundation",title:"Cooling starts with the path of the air.",body:"In a hot-aisle/cold-aisle arrangement, server intakes face the cold aisle and exhausts face the hot aisle. The goal is to reduce mixing between cool supply air and hot exhaust. This is an airflow concept; changes to a live room need coordination with its facilities team.",takeaway:"When reading a rack layout, identify the intake side, exhaust side, and return-air path.",minutes:2},["https://www.energystar.gov/products/data_center_equipment/16-more-ways-cut-energy-waste-data-center/move-hot-aislecold-aisle-layout","ENERGY STAR · Hot and cold aisles"]),
 c({id:"dc-ai-fabrics",kind:"lesson",topic:"Data centers",level:"Foundation",title:"An AI cluster has more than one network job.",body:"NVIDIA's DGX BasePOD NDR400 reference architecture describes a compute network, an Ethernet network for system management and storage, and an out-of-band management network. These roles help explain why training communication, data access, and administration are considered separately. This is one reference design, not a rule for every data center.",takeaway:"Read a cluster diagram by asking what each network carries and which devices it connects.",minutes:2},["https://docs.nvidia.com/dgx-basepod/reference-architecture-infrastructure-foundation-enterprise-ai/latest/reference-architectures.html","NVIDIA · DGX BasePOD reference architecture"]),
 c({id:"dc-gpu-health",kind:"lesson",topic:"Data centers",level:"Foundation",title:"GPU operations includes health, not just workloads.",body:"NVIDIA Data Center GPU Manager (DCGM) supports GPU behavior monitoring, configuration, policy oversight, health checks, diagnostics, and process statistics. These capabilities give infrastructure teams a way to observe and manage the GPUs supporting AI workloads.",takeaway:"Connect the software running on a GPU with the infrastructure tools used to monitor and maintain it.",minutes:2},["https://docs.nvidia.com/datacenter/dcgm/latest/user-guide/index.html","NVIDIA · DCGM overview"]),

 c({id:"net-mac",kind:"lesson",topic:"Networking",level:"Foundation",title:"IP finds the destination.\nMAC finds the next hop.",body:"Sending to another network? Your computer addresses the Ethernet frame to the gateway’s MAC address, while the IP packet still targets the remote host.",visual:"network",takeaway:"At each routed Ethernet hop, the link-layer addresses change. Without NAT, the source and destination IP addresses stay the same.",minutes:2},refs.network),
 c({id:"quiz-dns",kind:"quiz",topic:"CompTIA",level:"Foundation",title:"An IP address works. The hostname doesn’t. What do you check?",body:"A workstation reaches a server by IP address but cannot resolve its fully qualified domain name. Which service is the most likely problem?",options:["DHCP","DNS","NTP","SSH"],answer:1,explanation:"DNS resolves names to addresses. Reaching the server by IP makes name resolution the strongest clue. DHCP supplies network settings, NTP synchronizes clocks, and SSH provides remote access."},["https://www.rfc-editor.org/rfc/rfc1034","IETF · Domain names"]),
 c({id:"flash-cidr",kind:"flashcard",topic:"CCNA",level:"Foundation",title:"How many usable host addresses are in a /26 IPv4 subnet?",back:"62 usable hosts",explanation:"32 − 26 = 6 host bits. 2⁶ = 64 total addresses. In a conventional subnet, subtract the network and broadcast addresses: 64 − 2 = 62."},refs.subnet),
 c({id:"agent-loop",kind:"lesson",topic:"Agentic AI",level:"Intermediate",title:"A coding agent needs a feedback loop.",body:"Give the agent a bounded task, relevant project context, and a way to check its work. Tool results should inform its next action; a confident explanation is not a passing test.",visual:"workflow",takeaway:"Define the finish line: the behavior to change, a verification command, and the conditions that require a human decision.",minutes:2},refs.agent),
 c({id:"cloud-sg",kind:"quiz",topic:"Cloud",level:"Intermediate",title:"The security group allows the request. What about the reply?",body:"An EC2 instance receives traffic allowed by its AWS security group. How does that security group handle response traffic?",options:["It requires a matching outbound rule","It allows the response because it is stateful","It allows all future traffic from that source","It replaces the network ACL"],answer:1,explanation:"Security groups are stateful, so responses for an allowed flow are permitted regardless of opposite-direction rules. Network ACLs are separate stateless controls and can still block traffic."},refs.aws),
 c({id:"python-default",kind:"lesson",topic:"Languages",level:"Foundation",title:"The tiny Python default that remembers too much.",body:"Default arguments are evaluated once when the function is defined. A default list can share state between calls. Create a fresh list inside the function instead.",code:"def add_device(name, devices=None):\n    if devices is None:\n        devices = []\n    devices.append(name)\n    return devices",language:"Python",takeaway:"Use None as the default, then create mutable objects inside the function.",minutes:2},["https://docs.python.org/3/tutorial/controlflow.html#default-argument-values","Python · Default arguments"]),
 c({id:"flash-ram",kind:"flashcard",topic:"CompTIA",level:"Foundation",title:"RAM vs. storage: which loses its contents when power is removed?",back:"RAM is volatile.",explanation:"Ordinary system RAM needs power to retain data. SSDs and hard drives retain data without continuous power. More RAM can reduce paging, but does not increase disk capacity."},["https://www.ibm.com/think/topics/random-access-memory","IBM · RAM"]),
 c({id:"ml-leakage",kind:"lesson",topic:"Machine learning",level:"Intermediate",title:"A perfect score can be a warning sign.",body:"If test data influences training, evaluation stops representing unseen data. Even fitting a scaler before splitting your data can leak information.",code:"# With sklearn imports and X, y defined:\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42\n)\nmodel = make_pipeline(\n    StandardScaler(), LogisticRegression()\n)\nmodel.fit(X_train, y_train)\nmodel.score(X_test, y_test)",language:"Python · scikit-learn excerpt",takeaway:"Split first. Fit preprocessing on training data only. Keep a final test set out of model selection.",minutes:3},["https://scikit-learn.org/stable/common_pitfalls.html#data-leakage","scikit-learn · Data leakage"]),
 c({id:"dev-git",kind:"quiz",topic:"Development",level:"Foundation",title:"Undo a published commit without rewriting shared history.",body:"A bad commit has been pushed to a shared branch. Which command creates a new commit reversing its changes?",options:["git reset --hard HEAD~1","git clean -fd","git revert <commit>","git stash"],answer:2,explanation:"git revert records an inverse change in a new commit, preserving shared history. reset moves a branch pointer; rewriting published history can disrupt collaborators."},["https://git-scm.com/docs/git-revert","Git · revert"]),
 c({id:"workflow-validate",kind:"lesson",topic:"AI workflows",level:"Intermediate",title:"Turn unstructured text into a checked workflow.",body:"An AI extraction step can propose fields from a support ticket. Validate the fields against a schema, check the destination, and route ambiguous results to a person before consequential action.",code:'Ticket → extract → validate → route\n\n{\n  "category": "network",\n  "priority": "normal",\n  "needs_review": true\n}',language:"Workflow pattern",takeaway:"Valid JSON can still contain incorrect facts. Validate meaning and permissions as well as structure.",minutes:2},refs.agent),
 c({id:"ccna-route",kind:"quiz",topic:"CCNA",level:"Intermediate",title:"Two routes match. Which route wins?",body:"A router has 10.0.0.0/8 and 10.12.0.0/16 in its routing table. For destination 10.12.5.9, which is the best match?",options:["10.0.0.0/8","10.12.0.0/16","The route added first","Both always load-balance"],answer:1,explanation:"Forwarding uses the longest matching prefix. /16 is more specific than /8. Administrative distance and metrics help select routes for a prefix; they do not override a longer prefix during this lookup."},refs.subnet),
 c({id:"flash-async",kind:"flashcard",topic:"Languages",level:"Foundation",title:"What does an async JavaScript function always return?",back:"A Promise.",explanation:"A returned value becomes the fulfillment value; a thrown error rejects it. await pauses the surrounding async function while a promise settles, without blocking the entire runtime."},["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function","MDN · async function"]),
 c({id:"subnet-lesson",kind:"lesson",topic:"Networking",level:"Foundation",title:"A /24 is a boundary, not a class.",body:"CIDR tells you how many bits belong to the network prefix. IPv4 has 32 bits, so a /24 leaves 8 bits for addresses inside the subnet.",visual:"subnet",takeaway:"2⁸ = 256 total addresses. A conventional /24 has 254 usable hosts. /31 point-to-point links follow a special rule.",minutes:2},refs.subnet),
 c({id:"quiz-nvme",kind:"quiz",topic:"CompTIA",level:"Foundation",title:"M.2 tells you the shape. What tells you the protocol?",body:"An SSD specification lists M.2 PCIe NVMe. Which term names the storage protocol?",options:["M.2","NVMe","ATX","DDR5"],answer:1,explanation:"NVMe is the storage protocol. M.2 specifies a form factor and connector, and PCIe is the bus used here. Some M.2 drives use SATA, so M.2 alone does not guarantee NVMe compatibility."},["https://nvmexpress.org/specifications/","NVM Express · Specifications"]),
 c({id:"flash-vlan",kind:"flashcard",topic:"CCNA",level:"Foundation",title:"What does a VLAN separate on a switched network?",back:"Layer 2 broadcast domains.",explanation:"Different VLANs are separate broadcast domains. Communication between them normally requires a Layer 3 device. VLANs alone do not encrypt traffic."},refs.cisco),
 c({id:"cloud-private",kind:"lesson",topic:"Cloud",level:"Intermediate",title:"A private subnet is a routing decision.",body:"In AWS, a public subnet has a route to an internet gateway; a private subnet does not. An instance in a public subnet still needs suitable addressing and security rules for IPv4 internet access.",takeaway:"A NAT gateway can enable outbound IPv4 internet connections from a private subnet without allowing unsolicited inbound internet connections.",minutes:2},["https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html","AWS · Subnets"]),
 c({id:"ml-overfit",kind:"quiz",topic:"Machine learning",level:"Foundation",title:"Great training accuracy. Poor test accuracy. What happened?",body:"A model scores 99% on training data and 65% on representative held-out test data. What is the strongest initial suspect?",options:["Underfitting","Overfitting","Perfect generalization","Too little capacity, always"],answer:1,explanation:"The model may have learned training-specific patterns that do not generalize. Also check distribution differences and data quality. Use validation data to choose improvements such as regularization or lower complexity."},refs.ml),
 c({id:"agent-tools",kind:"flashcard",topic:"Agentic AI",level:"Intermediate",title:"What distinguishes an agent from a fixed AI workflow?",back:"The model dynamically chooses its next steps and tools.",explanation:"A workflow follows predefined code paths. An agent decides how to proceed using context and feedback, within the permissions and stop conditions you set."},refs.agent),
 c({id:"dev-idempotence",kind:"lesson",topic:"Development",level:"Intermediate",title:"Design for the request that happens twice.",body:"Networks retry. Clients time out. An idempotent operation has the same intended server-side effect when repeated as when performed once.",code:'PUT /devices/router-01\nContent-Type: application/json\n\n{ "location": "rack-04" }',language:"HTTP",takeaway:"PUT is defined as idempotent; POST is not inherently so. Idempotence concerns the intended effect, not identical response codes.",minutes:2},["https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods","IETF · HTTP semantics"]),
 c({id:"sql-null",kind:"quiz",topic:"Languages",level:"Foundation",title:"Find rows where an email address is missing.",body:"Which SQL condition selects rows whose email column is NULL?",options:["WHERE email = NULL","WHERE email IS NULL","WHERE email == 'NULL'","WHERE email = 0"],answer:1,explanation:"NULL represents an unknown or absent value. Ordinary equality with NULL yields unknown. Use IS NULL and IS NOT NULL to test for NULL."},["https://www.postgresql.org/docs/current/functions-comparison.html","PostgreSQL · Comparison predicates"]),
 c({id:"flash-dns",kind:"flashcard",topic:"Networking",level:"Foundation",title:"DNS A vs. AAAA: which maps a hostname to an IPv6 address?",back:"AAAA maps to IPv6.",explanation:"A records map names to IPv4 addresses. AAAA records map to IPv6 addresses. A hostname may have both. Other record types include MX and TXT."},["https://www.rfc-editor.org/rfc/rfc3596","IETF · DNS for IPv6"]),
 c({id:"workflow-human",kind:"quiz",topic:"AI workflows",level:"Intermediate",title:"An AI drafts a firewall change. What happens before production?",body:"The proposed rule widens network access. Which workflow provides the strongest control?",options:["Apply it if model confidence is high","Validate scope, test the rule, and require authorized review","Accept any syntactically valid output","Give the model permanent admin access"],answer:1,explanation:"Syntax and self-reported confidence do not establish correctness or authorization. Check the actual access change, test it, preserve rollback, and get appropriate approval for production."},refs.agent),
 c({id:"comptia-mfa",kind:"lesson",topic:"CompTIA",level:"Foundation",title:"Two passwords are still one factor.",body:"Authentication factors include something you know, something you have, and something you are. A password plus a PIN uses two knowledge secrets, not two factor categories.",takeaway:"A password plus a hardware security key combines knowledge and possession. Phishing resistance also depends on the authenticator and protocol.",minutes:2},["https://pages.nist.gov/800-63-4/sp800-63b.html","NIST · Authentication guidelines"]),
 c({id:"cloud-region",kind:"flashcard",topic:"Cloud",level:"Foundation",title:"Region vs. availability zone: which is the larger geographic grouping?",back:"A region contains availability zones.",explanation:"In AWS, an availability zone consists of one or more discrete data centers with redundant power and connectivity. A region contains multiple isolated zones. Multi-zone design reduces exposure to a single-zone failure."},["https://aws.amazon.com/about-aws/global-infrastructure/regions_az/","AWS · Regions and availability zones"]),
 c({id:"ts-types",kind:"lesson",topic:"Languages",level:"Intermediate",title:"TypeScript types disappear. Your inputs don’t.",body:"A type assertion does not validate a network response. TypeScript checks before execution, but untrusted data still needs runtime validation.",code:'const payload: unknown = await response.json();\n\nif (typeof payload !== "object" || payload === null) {\n  throw new Error("Expected an object");\n}\n// Validate required fields before using them.',language:"TypeScript",takeaway:"Treat external input as unknown. Use explicit checks or a schema validator before trusting its shape.",minutes:2},["https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions","TypeScript · Type assertions"]),
 c({id:"agent-scope",kind:"quiz",topic:"Agentic AI",level:"Intermediate",title:"Which brief gives a coding agent a useful finish line?",options:["Make this whole app better","Refactor everything you can","Fix the empty-search crash; preserve the API; add a regression check","Keep editing until the code looks modern"],answer:2,explanation:"A bounded problem, preserved contract, and observable verification make success assessable. Vague goals encourage unnecessary changes and provide no reliable stopping condition."},refs.agent),
 c({id:"ml-precision",kind:"flashcard",topic:"Machine learning",level:"Intermediate",title:"Of the alerts your model flagged, how many were actually threats?",back:"That measures precision.",explanation:"Precision = true positives / (true positives + false positives). Recall asks how many actual threats were detected. Balance the cost of missed threats against false alarms."},["https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall","Google · Classification metrics"]),
 c({id:"dev-tests",kind:"flashcard",topic:"Development",level:"Foundation",title:"Which test checks components working together?",back:"An integration test.",explanation:"A unit test checks a small unit of behavior in isolation. An integration test checks interactions, such as an API handler and database. End-to-end tests cover a broader user flow."},["https://martinfowler.com/bliki/IntegrationTest.html","Martin Fowler · Integration tests"]),
 c({id:"ccna-stp",kind:"lesson",topic:"CCNA",level:"Intermediate",title:"Redundant links need a loop strategy.",body:"A Layer 2 loop can circulate frames and create a broadcast storm. Spanning Tree Protocol forms a loop-free active topology by placing selected redundant paths into a non-forwarding state.",takeaway:"Redundancy provides alternate paths. STP coordinates which paths forward so that redundancy does not become a loop.",minutes:2},refs.cisco),
 c({id:"bash-pipe",kind:"quiz",topic:"Languages",level:"Foundation",title:"What does the pipe symbol do in a shell command?",body:"Consider: cat access.log | wc -l",options:["Runs commands on different servers","Sends standard output into the next command’s standard input","Redirects all errors into access.log","Encrypts the log"],answer:1,explanation:"A pipe connects standard output to the next command’s standard input. Here wc -l counts newline characters from the log. Standard error is not included by the plain | operator."},["https://www.gnu.org/software/bash/manual/html_node/Pipelines.html","GNU Bash · Pipelines"]),
 c({id:"workflow-eval",kind:"flashcard",topic:"AI workflows",level:"Advanced",title:"What stays constant when comparing two prompt versions?",back:"A representative evaluation set and scoring criteria.",explanation:"Run both versions on the same cases, including edge cases. Compare correctness, tool behavior, latency, and cost. Keep holdout cases to avoid overfitting your evaluation set."},refs.agent),
];
import { catalogCards } from "./catalog-records";
export { catalogCards };

const curiosityCards: Card[] = [
 {id:"curiosity-fact-moth",kind:"lesson",topic:"Development",level:"Foundation",title:"The bug was real. The word came first.",body:"In 1947, a moth was found in a Harvard Mark II relay and preserved in its logbook. Engineers already used the word ‘bug’ for faults. The famous moth story did not invent the term.",source:"https://www.computerhistory.org/tdih/september/9/",sourceName:"Computer History Museum · Tech history"},
 {id:"curiosity-fact-birds",kind:"lesson",topic:"Networking",level:"Foundation",title:"There is an RFC for sending IP packets by bird.",body:"RFC 1149 describes IP datagrams carried by avian carriers. Published on April Fools’ Day in 1990, it is networking humor—not deployment advice.",source:"https://www.rfc-editor.org/info/rfc1149/",sourceName:"RFC Editor · Tech history"},
 {id:"curiosity-fact-coffee",kind:"lesson",topic:"Development",level:"Foundation",title:"Your coffee pot got its own protocol proposal.",body:"The Hyper Text Coffee Pot Control Protocol appeared in RFC 2324 on April 1, 1998. This informational April Fools’ document explicitly does not specify an Internet standard.",source:"https://www.rfc-editor.org/info/rfc2324/",sourceName:"RFC Editor · Tech history"},
 ...([
 ["Networking","The network is fine.","Narrator: The DNS cache had requested legal representation."],
 ["Cloud","Cloud cost optimization","Step one: discover the test server you named temporary three years ago."],
 ["Agentic AI","My agent finished the task.","It also opened six follow-up tasks and promoted itself to project manager."],
 ["Machine learning","Perfect training accuracy","My model has memorized the textbook and would prefer no follow-up questions."],
 ["Data centers","A quiet day in the data center","The fans disagree with this description."],
 ["Development","It works on my machine.","My machine has declined the invitation to production."],
 ["Languages","Learning a second language","Now I can forget semicolons in two ecosystems."],
 ["AI workflows","Automation saves time.","I spent the saved time naming the workflow final_final_really_final."],
 ["CCNA","Subnetting confidence","I know exactly how many hosts fit. I just need everyone to stop watching me count."],
 ["CompTIA","The troubleshooting process","First, identify the problem. The printer has identified me as the problem."],
 ["Development","One small dependency","It brought its friends. All 842 of them."],
 ["Agentic AI","Human in the loop","The human is currently in a loop asking why the agent is in a loop."]
 ] as [Topic,string,string][]).map(([topic,title,body],i)=>({id:`curiosity-humor-${i+1}`,kind:"humor" as const,topic,level:"Foundation" as const,title,body,source:"https://stackscroll.bigdawgroof812178.chatgpt.site/terms",sourceName:"Stackscroll Originals · Fiction"}))
];
// New source-linked guides are separate from the immutable launch-1000 edition.
export const expandedGuides:Card[]=( [
 ["Cybersecurity","OWASP application security testing","https://owasp.org/www-project-web-security-testing-guide/"],
 ["Cybersecurity","OWASP application verification requirements","https://github.com/OWASP/ASVS"],
 ["Cybersecurity","OWASP API security","https://owasp.org/API-Security/"],
 ["Cybersecurity","OWASP secure coding cheat sheets","https://cheatsheetseries.owasp.org/"],
 ["Cybersecurity","PortSwigger web security learning labs","https://portswigger.net/web-security"],
 ["Cybersecurity","MITRE ATT&CK knowledge base","https://attack.mitre.org/"],
 ["Cybersecurity","OpenSSF secure development learning","https://openssf.org/training/"],
 ["Cybersecurity","NIST cybersecurity framework","https://www.nist.gov/cyberframework"],
 ["Data engineering","Apache Airflow workflow documentation","https://airflow.apache.org/docs/"],
 ["Data engineering","Apache Kafka documentation","https://kafka.apache.org/documentation/"],
 ["Data engineering","Apache Spark documentation","https://spark.apache.org/docs/latest/"],
 ["Data engineering","Apache Flink documentation","https://nightlies.apache.org/flink/flink-docs-stable/"],
 ["Data engineering","DuckDB SQL documentation","https://duckdb.org/docs/stable/"],
 ["Data engineering","dbt documentation","https://docs.getdbt.com/docs/introduction"],
 ["Data engineering","Apache Arrow documentation","https://arrow.apache.org/docs/"],
 ["Data engineering","Apache Iceberg documentation","https://iceberg.apache.org/docs/latest/"],
 ["DevOps","Jenkins user handbook","https://www.jenkins.io/doc/book/"],
 ["DevOps","OpenTelemetry documentation","https://opentelemetry.io/docs/"],
 ["DevOps","Prometheus overview","https://prometheus.io/docs/introduction/overview/"],
 ["DevOps","Grafana documentation","https://grafana.com/docs/"],
 ["DevOps","Argo CD documentation","https://argo-cd.readthedocs.io/en/stable/"],
 ["DevOps","Ansible project and documentation","https://github.com/ansible/ansible"],
 ["DevOps","OpenTofu documentation","https://opentofu.org/docs/"],
 ["DevOps","Google site reliability books","https://sre.google/books/"],
 ["Web & accessibility","W3C accessibility tutorials","https://www.w3.org/WAI/tutorials/"],
 ["Web & accessibility","W3C accessible design patterns","https://www.w3.org/WAI/ARIA/apg/"],
 ["Web & accessibility","W3C accessible forms","https://www.w3.org/WAI/tutorials/forms/"],
 ["Web & accessibility","Web.dev accessibility course","https://web.dev/learn/accessibility"],
 ["Web & accessibility","Web.dev responsive design course","https://web.dev/learn/design"],
 ["Web & accessibility","Web.dev performance course","https://web.dev/learn/performance"],
 ["Web & accessibility","MDN accessibility reference","https://developer.mozilla.org/en-US/docs/Web/Accessibility"],
 ["Web & accessibility","MDN web components","https://developer.mozilla.org/en-US/docs/Web/API/Web_components"],
 ["Mobile development","Android architecture guidance","https://developer.android.com/topic/architecture"],
 ["Mobile development","Android Jetpack Compose","https://developer.android.com/develop/ui/compose/documentation"],
 ["Mobile development","Android app testing","https://developer.android.com/training/testing"],
 ["Mobile development","Apple SwiftUI documentation","https://developer.apple.com/documentation/swiftui"],
 ["Mobile development","Swift language guide","https://docs.swift.org/swift-book/documentation/the-swift-programming-language/"],
 ["Mobile development","Flutter learning path","https://docs.flutter.dev/get-started/learn-flutter"],
 ["Mobile development","React Native fundamentals","https://reactnative.dev/docs/getting-started"],
 ["Mobile development","Kotlin Multiplatform documentation","https://kotlinlang.org/docs/multiplatform.html"],
 ["Robotics & IoT","ROS 2 tutorials","https://docs.ros.org/en/jazzy/Tutorials.html"],
 ["Robotics & IoT","ROS 2 concepts","https://docs.ros.org/en/jazzy/Concepts.html"],
 ["Robotics & IoT","Arduino documentation","https://docs.arduino.cc/"],
 ["Robotics & IoT","Raspberry Pi documentation","https://github.com/raspberrypi/documentation"],
 ["Robotics & IoT","MicroPython documentation","https://docs.micropython.org/en/latest/"],
 ["Robotics & IoT","Zephyr development documentation","https://docs.zephyrproject.org/latest/"],
 ["Robotics & IoT","ESP-IDF development guide","https://docs.espressif.com/projects/esp-idf/en/stable/esp32/"],
 ["Robotics & IoT","Gazebo simulation documentation","https://gazebosim.org/docs/latest/"],
] as [Topic,string,string][]).map(([topic,title,source],index)=>({id:`expanded-guide-${index+1}`,kind:"resource",topic,title,source,sourceName:new URL(source).hostname,level:"Foundation",body:"Explore the original documentation, examples, and learning material. Save this guide to shape your next mix or use its topic to start a Stack."}));
export const licensedCards:Card[]=[
 {id:"licensed-web-vitals",kind:"lesson",topic:"Web & accessibility",level:"Foundation",title:"Measure the experience, not just the download.",body:"A page can load quickly and still feel frustrating. Core Web Vitals examine loading, responsiveness, and visual stability. Compare real-user measurements with lab tests: each reveals different problems.",source:"https://web.dev/articles/vitals",sourceName:"Philip Walton / Google · Web Vitals"},
 {id:"licensed-devtools",kind:"lesson",topic:"Development",level:"Foundation",title:"Choose the browser tool that matches the question.",body:"Use Elements to inspect page structure and styles, Network to examine requests, and Sources to debug JavaScript. Performance recordings help investigate slow interactions. Begin with a specific symptom, then choose the relevant panel.",source:"https://developer.chrome.com/docs/devtools/overview",sourceName:"Google · Chrome DevTools"},
 {id:"licensed-overfitting",kind:"lesson",topic:"Machine learning",level:"Foundation",title:"A model must succeed beyond its training examples.",body:"Excellent training results can hide poor performance on unseen examples. Compare training and validation loss: increasing validation loss while training loss falls can signal overfitting. Model complexity and unrepresentative data are common contributors.",source:"https://developers.google.com/machine-learning/crash-course/overfitting/overfitting",sourceName:"Google · Machine Learning Crash Course"},
 {id:"licensed-classification",kind:"lesson",topic:"Machine learning",level:"Foundation",title:"Choose a metric that reflects the cost of mistakes.",body:"Precision asks how many positive predictions were correct. Recall asks how many actual positives were found. Accuracy alone can mislead when classes are imbalanced. Choose metrics with the consequences of missed cases and false alarms in mind.",source:"https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall",sourceName:"Google · Machine Learning Crash Course"},
];
export const cards: Card[] = [...coreCards, ...catalogCards, ...curiosityCards, ...expandedGuides, ...licensedCards];
export const cardById = new Map(cards.map(card => [card.id, card]));
export function resolveCatalogSaved(saved: Card[], resolveOther: (saved: Card[]) => Card[]): Card[] {
  return saved.flatMap(card => (card.id.startsWith("catalog-")||card.id.startsWith("curiosity-")) ? (cardById.has(card.id) ? [cardById.get(card.id)!] : []) : resolveOther([card]));
}
export const curatedNews:Card[]=[
  {
    "id": "news-linux-2027-preview",
    "kind": "news",
    "topic": "Cloud",
    "level": "Intermediate",
    "title": "Amazon Linux 2027 is now available in public preview",
    "body": "AWS opened an early release of its next Linux distribution for application testing and feedback. It includes newer development tools, SELinux enforcement by default, and images for both major processor architectures.",
    "takeaway": "Preview release: test compatibility in a lab before planning production changes.",
    "source": "https://aws.amazon.com/about-aws/whats-new/2026/09/announcing-amazon-linux-2027/",
    "sourceName": "AWS · What’s New",
    "date": "2026-09-03"
  },
  {
    "id": "news-bedrock-sync",
    "kind": "news",
    "topic": "AI workflows",
    "level": "Intermediate",
    "title": "Amazon Bedrock Managed Knowledge Base now supports automatic sync scheduling for data source connectors",
    "body": "Teams can schedule source refreshes at daily, weekly, or monthly intervals. The feature reduces manual work and custom scheduling infrastructure for retrieval systems that depend on changing enterprise documents.",
    "takeaway": "A retrieval workflow needs a freshness policy as well as a good model.",
    "source": "https://aws.amazon.com/about-aws/whats-new/2026/09/amazon-bedrock-managed-knowledge-base-automatic-sync-scheduling-data-source-connectors/",
    "sourceName": "AWS · What’s New",
    "date": "2026-09-04"
  },
  {
    "id": "news-cloudflare-cache",
    "kind": "news",
    "topic": "Networking",
    "level": "Intermediate",
    "title": "How we could save petabytes of cache storage with Zstandard and Pingora",
    "body": "Cloudflare tested compressing eligible cached content to reduce disk use and transfers between data centers. Results from a limited test corpus suggest substantial savings for modest CPU overhead; broader evaluation remains planned.",
    "takeaway": "Engineering experiment: distinguish a prototype result from a completed production rollout.",
    "source": "https://blog.cloudflare.com/cache-transcoding/",
    "sourceName": "Cloudflare · Engineering",
    "date": "2026-09-01"
  }
];

export const paths = [
 {id:"foundation",name:"IT foundations",eyebrow:"BUILD YOUR BASE",description:"Hardware, support, networking, and security fundamentals.",topics:["CompTIA","Networking"] as Topic[],steps:["CompTIA A+ concepts","Network+ fundamentals","Security fundamentals"]},
 {id:"network",name:"Network → Cloud",eyebrow:"CONNECT THE DOTS",description:"From packets and VLANs to routing and cloud infrastructure.",topics:["CCNA","Networking","Cloud"] as Topic[],steps:["IP addressing & switching","CCNA routing concepts","Cloud networking"]},
 {id:"software",name:"Build & ship software",eyebrow:"MAKE IT WORK",description:"Languages, version control, APIs, and dependable software.",topics:["Languages","Development"] as Topic[],steps:["Python, JavaScript & SQL","Git, APIs & testing","TypeScript & reliability"]},
 {id:"ai",name:"AI systems",eyebrow:"YOUR NEXT LEVEL",description:"Build toward ML systems, coding agents, and practical AI automation.",topics:["Machine learning","Agentic AI","AI workflows"] as Topic[],steps:["ML & evaluation foundations","Agentic coding","Reliable AI workflows"]},
];
