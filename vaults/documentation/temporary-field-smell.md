# Temporary Field

An [[object-orientation-abuser-smells|object-orientation abuser]] [[code-smells|smell]]. Fields in a class that are only populated under certain circumstances and remain empty or unused the rest of the time.

Objects become confusing when some fields are only sometimes meaningful. Code must check whether a field has been set before using it, adding conditional complexity throughout the class.
