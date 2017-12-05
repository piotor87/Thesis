import numpy as np
import networkx as nx
import pylab
import matplotlib as mpl
mpl.use('TkAgg')
from matplotlib import pyplot as plt
from verkko.plots import matplotlibHelperFunction as HF
import color_map as cm
color_dict = cm.return_color_dict()
import binner
from matplotlib.font_manager import FontProperties
import Tools
import matplotlib.artist as artists


def return_function(args = 'random'):

    if args == 'random':
        func = nx.fast_gnp_random_graph
    elif args == 'barabasi':
        func = nx.barabasi_albert_graph

    return func



import networkx as nx
import matplotlib.pyplot as plt
def karate():

 # SETUP FIGURE
    pylab.ioff()

    finalFigPath ='/m/cs/project/isi/Pietro/Thesis/Figures/karate_nx'
    print finalFigPath


    fig = HF.setFigure()
    gs = mpl.gridspec.GridSpec(1,1)
    ax = fig.add_subplot(gs[0, 0])


    G = nx.karate_club_graph()
    # draw graph in inset
    colors = []
    for node in G.nodes():
        if G.degree(node) < 13:
            colors.append('red')
        else:
            colors.append('blue')
  
    Gcc=sorted(nx.connected_component_subgraphs(G), key = len, reverse=True)[0]
    pos=nx.spring_layout(Gcc)
    plt.axis('off')
    nx.draw_networkx_nodes(G,pos,node_size=20,node_color = colors)
    nx.draw_networkx_edges(G,pos,alpha=0.4)
 #   nx.draw(G,pos,node_color = colors,node_size = 20)

    

    gs.tight_layout(fig, rect=[0.05,None,None,.95], pad=0.0, w_pad=0.0, h_pad=0.)

    plt.savefig(finalFigPath + '.pdf')

def plot_degree():

 # SETUP FIGURE
    pylab.ioff()

    finalFigPath ='/m/cs/project/isi/Pietro/Thesis/Figures/degree_histogram'
    print finalFigPath


    fig = HF.setFigure()
    gs = mpl.gridspec.GridSpec(2,2)
    ax = fig.add_subplot(gs[0, 0])


    func = nx.fast_gnp_random_graph
    G = func(20,0.4)
  # draw graph in inset
    Gcc=sorted(nx.connected_component_subgraphs(G), key = len, reverse=True)[0]
    pos=nx.spring_layout(Gcc)
    plt.axis('off')
    nx.draw_networkx_nodes(Gcc,pos,node_size=20)
    nx.draw_networkx_edges(Gcc,pos,alpha=0.4)
    
    #DEGREE DISTRIBUTION
    ax = fig.add_subplot(gs[1, 0])
    N = 2000000
    G = func(N,10./N)
  
    data = np.array(nx.degree(G).values())
    data = data[data>0]
    print len(data)
    bins = binner.Bins(float,1,data.max(),'lin',data.max() -1)
    countNotNormalized=bins.bin_count_divide(data) # counts data point density in bin
    count=np.array(binner.normalize(list(countNotNormalized))) # normalized densities to sum to one
    binAvg = bins.bin_average(zip(data,data))
    binMask = ~np.ma.getmask(binAvg)
    ax.plot(binAvg[binMask],count[binMask],'b-',marker='o')
    ax.set_ylabel("P(k)")
    ax.set_xlabel("k")
    ax.set_xlim((1,data.max()))

    ax = fig.add_subplot(gs[0, 1])

    func = nx.barabasi_albert_graph
    G = func(30,1)
  # draw graph in inset
    Gcc=sorted(nx.connected_component_subgraphs(G), key = len, reverse=True)[0]
    pos=nx.spring_layout(Gcc)
    plt.axis('off')
    nx.draw_networkx_nodes(Gcc,pos,node_size=20)
    nx.draw_networkx_edges(Gcc,pos,alpha=0.4)

    ax = fig.add_subplot(gs[1, 1])

    G = func(200000,10)
  
    data = np.array(nx.degree(G).values())

    bins = binner.Bins(float,1,data.max(),'log',1.3)
    countNotNormalized=bins.bin_count_divide(data) # counts data point density in bin
    count=np.array(binner.normalize(list(countNotNormalized))) # normalized densities to sum to one
    binAvg = bins.bin_average(zip(data,data))
    binMask = ~np.ma.getmask(binAvg)
    ax.plot(binAvg[binMask],count[binMask],'b-',marker='o')
    ax.set_xlabel("k")
    ax.set_xscale('log')
    ax.set_yscale('log')

    fig.subplots_adjust(wspace=0, hspace=.3)
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)


    fig.text(0.25,0.97, 'Random Graph', fontsize=7, verticalalignment='center',fontweight='bold', va='top', bbox = props)
    fig.text(0.75,0.97, 'Scale free', fontsize=7, verticalalignment='center',fontweight='bold', va='top', bbox = props)


    gs.tight_layout(fig, rect=[0.05,None,None,.95], pad=0.0, w_pad=0.0, h_pad=0.)

    plt.savefig(finalFigPath + '.pdf')



'''
  #BARABASI GRAPH
    ax = fig.add_subplot(gs[1, 0])
    func = nx.barabasi_albert_graph
    G = func(20,5)

    # draw graph in inset

    plt.axes([0.45,0.45,0.45,0.45])
    Gcc=sorted(nx.connected_component_subgraphs(G), key = len, reverse=True)[0]
    pos=nx.spring_layout(Gcc)
    plt.axis('off')
    nx.draw_networkx_nodes(Gcc,pos,node_size=20)
    nx.draw_networkx_edges(Gcc,pos,alpha=0.4)
    degree_sequence=sorted(nx.degree(G).values(),reverse=True) # degree sequence
    data = np.array(degree_sequence)
    print data
    bins = binner.Bins(float,1,data.max(),'lin',20)
    countNotNormalized=bins.bin_count_divide(data) # counts data point density in bin
    count=np.array(binner.normalize(list(countNotNormalized))) # normalized densities to sum to one

    binAvg = bins.bin_average(zip(data,data))
    binMask = ~np.ma.getmask(binAvg)
    plotData = np.cumsum(count[binMask])
    #print "Degree sequence", degree_sequence

    dmax=max(degree_sequence)
    ax.plot(binAvg[binMask],count[binMask],'b-',marker='o')

   # plt.loglog(binAvg[binMask],plotData,'b-',marker='o')
  #  plt.title("Degree rank plot")
    ax.set_ylabel("P(k)")
    ax.set_xlabel("k")
    ax.set_xscale('log')
    ax.set_yscale('log')


    # draw graph in inset
    plt.axes([0.45,0.45,0.45,0.45])
    Gcc=sorted(nx.connected_component_subgraphs(G), key = len, reverse=True)[0]
    pos=nx.spring_layout(Gcc)
    plt.axis('off')
    nx.draw_networkx_nodes(Gcc,pos,node_size=20)
    nx.draw_networkx_edges(Gcc,pos,alpha=0.4)
'''
