# UML Data Transformation

The process of transforming data from an IT system's internal representation into [[uml-system-integration-message|message]] format for [[uml-modeling-system-integration|system integration]].

## Key principles

- Multiple IT system classes may combine into one [[uml-business-object|business object]] class
- Only relevant attributes are adopted for the business object
- Selection criteria (e.g., flight number + date) filter to specific instances
- Derived data (e.g., count of luggage pieces) must be calculated during transformation
- Metadata (sender/receiver IDs, timestamps, message IDs) must be added

## Construction approach

A top-down approach derives business object structure from business process needs rather than IT system internals. This ensures business objects remain independent of the IT system and therefore reusable.

The central question: "What is the minimum information that the receiving IT system needs to perform its work?"

## See also

- [[uml-constructing-integration-class-diagrams]] — step-by-step construction including transformation
- [[uml-electronic-data-interchange]] — the target formats for transformed data
