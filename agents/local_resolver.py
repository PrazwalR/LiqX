"""
Local Agent Resolver for Development

Allows agents to communicate locally without Almanac registration.
Maps agent addresses to HTTP endpoints for direct communication.
"""

# Local agent endpoint mappings
LOCAL_AGENT_ENDPOINTS = {
    # Position Monitor
    "agent1qvvp0sl4xwj04jjheaqwl9na6n4ef8zqrv55qfw96jv2584ze0v6cehs64a": "http://localhost:8000/submit",

    # Yield Optimizer (deterministic from seed)
    "agent1q0rtan6yrc6dgv62rlhtj2fn5na0zv4k8mj47ylw8luzyg6c0xxpspk9706": "http://localhost:8001/submit",

    # Swap Optimizer (future)
    "agent1qswap0000000000000000000000000000000000000000000000000000": "http://localhost:8002/submit",

    # Executor (future)
    "agent1qexec0000000000000000000000000000000000000000000000000000": "http://localhost:8003/submit",
}


def get_local_endpoint(agent_address: str) -> str:
    """
    Get local HTTP endpoint for an agent address.
    Used for development without Almanac.
    """
    return LOCAL_AGENT_ENDPOINTS.get(agent_address)
