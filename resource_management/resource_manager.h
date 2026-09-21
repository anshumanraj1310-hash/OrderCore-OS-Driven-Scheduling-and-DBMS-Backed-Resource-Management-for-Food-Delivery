#ifndef RESOURCE_MANAGER_H
#define RESOURCE_MANAGER_H

#include "agent.h"
#include <vector>
using namespace std;

class ResourceManager
{
private:
    vector<Agent> agents;

public:
    void addAgent(int id, string name);
    void showAgents();
    bool assignAgent();
    void releaseAgent();
};

#endif