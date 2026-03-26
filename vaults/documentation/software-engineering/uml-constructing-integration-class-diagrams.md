# Constructing UML Integration Class Diagrams

Step-by-step guide for building [[uml-class-diagram|class diagrams]] in the [[uml-static-view|static view]] of [[uml-modeling-system-integration|system integration]], describing [[uml-business-object|business object]] structure.

## Construction steps

1. **Collect information** — use a top-down approach where business processes form the foundation. Central question: "What is the minimum information the receiving IT system needs?"
2. **Construct class diagram** — model the classes enabling delivery of necessary data
3. **Adopt from existing IT systems** — examine IT system class diagrams as source material using "classname.attribute" notation
4. **Derive remaining elements** — use clear identification (semantic keys or serial numbers), derived calculations (counting related objects), and metadata (sender/receiver IDs, timestamps)
5. **Define relationships** — identify classes from business models, add connection classes, transform IT system classes to business object classes
6. **Verify** — completeness (contains all needed information), interpretability (understandable to outsiders), standards compliance, relationship quality, correctness (stakeholder review)

## Standards guidance

Examine standard message catalogues (UN/ECE, ebXML, industry-specific suppliers) even when not mandatory — they provide valuable design suggestions.

## See also

- [[uml-data-transformation]] — the process of mapping IT system data to message format
- [[uml-electronic-data-interchange]] — the target standards for exchanged messages
