import networkx as nx
import community as community_louvain # python-louvain
import numpy as np

def generate_synthetic_network():
    # Use the same planted partition model as the frontend
    # 32 nodes, 4 communities
    sizes = [9, 8, 7, 8]
    p_in = 0.8
    p_out = 0.05
    G = nx.random_partition_graph(sizes, p_in, p_out, seed=42)
    
    # Add weights and timestamps
    for u, v, d in G.edges(data=True):
        d['weight'] = 1
        d['timestamp'] = np.random.randint(1, 100)
        
    return G

# Load the graph globally for the prototype
G = generate_synthetic_network()

# Precompute metrics
def precompute_analysis(graph):
    # Louvain communities
    partition = community_louvain.best_partition(graph)
    
    # Calculate stability via repeated Louvain runs
    runs = 10
    node_communities = {node: [] for node in graph.nodes()}
    
    for _ in range(runs):
        part = community_louvain.best_partition(graph, randomize=True)
        for node, c in part.items():
            node_communities[node].append(c)
            
    # Calculate stability score
    stability_scores = {}
    for node, comms in node_communities.items():
        # Frequency of the most common community assignment
        freq = max([comms.count(c) for c in set(comms)])
        stability_scores[node] = freq / runs
        
    # Centrality metrics
    degree_cent = nx.degree_centrality(graph)
    betweenness_cent = nx.betweenness_centrality(graph)
    closeness_cent = nx.closeness_centrality(graph)
    
    # Modularity
    modularity = community_louvain.modularity(partition, graph)
    
    return {
        'partition': partition,
        'stability': stability_scores,
        'degree': degree_cent,
        'betweenness': betweenness_cent,
        'closeness': closeness_cent,
        'modularity': modularity,
        'runs': runs
    }

analysis_data = precompute_analysis(G)
