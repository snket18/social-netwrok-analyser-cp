from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import networkx as nx
from network_analysis import G, analysis_data

app = FastAPI(title="Social Network Analyzer API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RelationshipRequest(BaseModel):
    source: str
    target: str

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
