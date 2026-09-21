#include "resource_manager.h"
#include <iostream>
using namespace std;

void ResourceManager::addAgent(int id, string name)
{
    Agent a(id, name);
    agents.push_back(a);
}

void ResourceManager::showAgents()
{
    for (int i = 0; i < agents.size(); i++)
    {
        agents[i].showAgent();
        cout << endl;
    }
}

bool ResourceManager::assignAgent()
{
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

void ResourceManager::releaseAgent()
{
    for (int i = 0; i < agents.size(); i++)
    {
        if (!agents[i].available)
        {
            agents[i].available = true;

            cout << "Agent " << agents[i].name
                 << " released." << endl;

            return;
        }
    }

    cout << "No busy agent found." << endl;
}