
#include "resource_manager.h"
#include <iostream>
#include <mutex>

using namespace std;

void ResourceManager::addAgent(int id, string name)
{
    lock_guard<mutex> lock(agentMutex);

    Agent a(id, name);
    agents.push_back(a);
}

void ResourceManager::showAgents()
{
    lock_guard<mutex> lock(agentMutex);

    for (int i = 0; i < agents.size(); i++)
    {
        agents[i].showAgent();
        cout << endl;
    }
}

bool ResourceManager::assignAgent()
{
    lock_guard<mutex> lock(agentMutex);

    for (int i = 0; i < agents.size(); i++)
    {
        if (agents[i].available)
        {
            agents[i].available = false;

            cout << "Agent " << agents[i].name
                 << " assigned to order." << endl;

            return true;
        }
    }

    cout << "No agent available." << endl;
    return false;
}

bool ResourceManager::releaseAgent(int agentId)
{
    lock_guard<mutex> lock(agentMutex);

    for (int i = 0; i < agents.size(); i++)
    {
        if (agents[i].agent_id == agentId &&
            !agents[i].available)
        {
            agents[i].available = true;

            cout << "Agent " << agents[i].name
                 << " released." << endl;

            return true;
        }
    }

    cout << "Agent not found or is not busy." << endl;
    return false;
}
