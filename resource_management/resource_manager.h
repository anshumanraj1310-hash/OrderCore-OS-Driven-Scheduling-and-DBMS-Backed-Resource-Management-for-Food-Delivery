
#ifndef RESOURCE_MANAGER_H
#define RESOURCE_MANAGER_H

#include "agent.h"
#include <vector>
#include <mutex>

using namespace std;

class ResourceManager
{
private:
    vector<Agent> agents;
    mutex agentMutex;

public:
    void addAgent(int id, string name);
    void showAgents();
    bool assignAgent();
    bool releaseAgent(int agentId);
};

#endif
