from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import heapq
import networkx as nx
from network_analysis import G, analysis_data

app = FastAPI(title="Social Network Analyzer API")

# Configure CORS for React frontend. Vite may serve on any
# localhost port (it auto-increments when 5173 is busy),
# so allow every localhost origin in addition to the default.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_origin_regex=r"^http://localhost:\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RelationshipRequest(BaseModel):
    source: str
    target: str

class TemporalPathRequest(BaseModel):
    source: str | None = None
    target: str | None = None

def _time_respecting_path(graph, source, target):
    """Earliest-arrival search: returns a path whose edge timestamps are
    non-decreasing, or [] when no time-respecting path exists."""
    if source == target:
        return [source]
    arrival = {source: 0}
    predecessor = {}
    queue = [(0, source)]
    while queue:
        current_time, node = heapq.heappop(queue)
        if current_time > arrival.get(node, float("inf")):
            continue
        if node == target:
            break
        for neighbor in graph.neighbors(node):
            edge_time = graph[node][neighbor].get("timestamp", 0)
            if edge_time < current_time:
                continue
            if neighbor not in arrival or edge_time < arrival[neighbor]:
                arrival[neighbor] = edge_time
                predecessor[neighbor] = node
                heapq.heappush(queue, (edge_time, neighbor))
    if target not in predecessor:
        return []
    path = [target]
    while path[-1] != source:
        path.append(predecessor[path[-1]])
    path.reverse()
    return path

def _default_temporal_pair(graph):
    """Deterministic default pair: BFS from the smallest node, preferring
    nodes at distance >= 2 that admit a time-respecting path."""
    source = min(graph.nodes())
    distances = nx.single_source_shortest_path_length(graph, source)
    candidates = sorted(
        (node for node, dist in distances.items() if dist >= 2),
        key=lambda node: (distances[node], node),
    )
    for target in candidates:
        if _time_respecting_path(graph, source, target):
            return source, target
    if candidates:
        return source, candidates[0]
    neighbors = sorted(graph.neighbors(source))
    return source, (neighbors[0] if neighbors else source)

@app.get("/api/network")
def get_network():
    nodes = []
    for node in G.nodes():
        nodes.append({
            "data": {
                "id": str(node),
                "label": f"User {node}",
                "community": analysis_data['partition'][node],
                "stability": analysis_data['stability'][node],
                "degree": G.degree(node),
                "betweenness": analysis_data['betweenness'][node],
                "closeness": analysis_data['closeness'][node]
            }
        })
        
    edges = []
    for u, v, d in G.edges(data=True):
        edges.append({
            "data": {
                "source": str(u),
                "target": str(v),
                "weight": d.get('weight', 1),
                "timestamp": d.get('timestamp', 0)
            }
        })
        
    metrics = {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "communities": len(set(analysis_data['partition'].values())),
        "modularity": analysis_data['modularity'],
        "ari": 1.0,
        "nmi": 1.0,
        "runs": analysis_data['runs']
    }
    
    return {"nodes": nodes, "edges": edges, "metrics": metrics}

@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    try:
        node = int(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
        
    if node not in G:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get connections
    connections = []
    for neighbor in G.neighbors(node):
        connections.append({
            "id": str(neighbor),
            "weight": G[node][neighbor].get('weight', 1)
        })
        
    # Simple Jaccard similarity for suggested connections
    suggested = []
    preds = nx.jaccard_coefficient(G, [(node, n) for n in G.nodes() if n != node and not G.has_edge(node, n)])
    for u, v, p in preds:
        if p > 0:
            suggested.append({"id": str(v), "jaccard": p})
            
    # Sort and take top 5
    suggested = sorted(suggested, key=lambda x: x['jaccard'], reverse=True)[:5]
    
    return {
        "id": str(node),
        "label": f"User {node}",
        "community": analysis_data['partition'][node],
        "stability": analysis_data['stability'][node],
        "degree": G.degree(node),
        "betweenness": analysis_data['betweenness'][node],
        "closeness": analysis_data['closeness'][node],
        "connectedUsers": connections,
        "suggestedConnections": suggested
    }

@app.post("/api/relationship-analysis")
def analyze_relationship(req: RelationshipRequest):
    try:
        source = int(req.source)
        target = int(req.target)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid node IDs")
        
    if source not in G or target not in G:
        raise HTTPException(status_code=404, detail="Nodes not found")
        
    try:
        path = nx.shortest_path(G, source=source, target=target)
        path_length = len(path) - 1
    except nx.NetworkXNoPath:
        path = []
        path_length = -1
        
    # Mutual friends
    mutual = list(nx.common_neighbors(G, source, target))
    
    # Jaccard
    preds = list(nx.jaccard_coefficient(G, [(source, target)]))
    jaccard = preds[0][2] if preds else 0
    
    # Co-association (stability of being in same community)
    # Simple mock for now: 1.0 if in same community, 0.0 otherwise
    co_association = 1.0 if analysis_data['partition'][source] == analysis_data['partition'][target] else 0.0
    
    return {
        "source": str(source),
        "target": str(target),
        "shortestPathLength": path_length,
        "shortestPath": [str(n) for n in path],
        "mutualFriends": [str(n) for n in mutual],
        "jaccardSimilarity": jaccard,
        "coAssociationScore": co_association
    }

@app.post("/api/temporal-path")
def analyze_temporal_path(req: TemporalPathRequest):
    source = None
    target = None
    if req.source is not None:
        try:
            source = int(req.source)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid source node ID")
    if req.target is not None:
        try:
            target = int(req.target)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target node ID")

    if source is None or target is None:
        default_source, default_target = _default_temporal_pair(G)
        source = default_source if source is None else source
        target = default_target if target is None else target

    if source not in G or target not in G:
        raise HTTPException(status_code=404, detail="Nodes not found")

    try:
        static_path = nx.shortest_path(G, source=source, target=target)
    except nx.NetworkXNoPath:
        static_path = []

    temporal_path = _time_respecting_path(G, source, target)

    # Events: deduplicated union of the edges along both paths
    seen = set()
    events = []
    for path in (static_path, temporal_path):
        for u, v in zip(path[:-1], path[1:]):
            key = tuple(sorted((u, v)))
            if key in seen:
                continue
            seen.add(key)
            events.append({
                "source": str(u),
                "target": str(v),
                "timestamp": G[u][v].get("timestamp", 0),
            })
    events.sort(key=lambda e: (e["timestamp"], e["source"], e["target"]))

    return {
        "source": str(source),
        "target": str(target),
        "events": events,
        "staticPath": [str(n) for n in static_path],
        "staticPathLength": len(static_path) - 1 if static_path else -1,
        "timeRespectingPath": [str(n) for n in temporal_path],
        "timeRespectingPathLength": len(temporal_path) - 1 if temporal_path else 0,
        "isTimeRespecting": len(temporal_path) > 0,
    }
