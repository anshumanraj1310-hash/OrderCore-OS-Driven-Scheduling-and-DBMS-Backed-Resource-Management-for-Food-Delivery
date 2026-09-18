#include "agent.h"
#include <iostream>
using namespace std;

Agent::Agent(int id, string n)
{
    agent_id = id;
    name = n;
    available = true;
}

void Agent::showAgent()
{
    cout << "Agent ID: " << agent_id
         << endl;
    cout << "Agent Name: " <<
    name << endl;

    if (available)
        cout << "Status: Available" <<
        endl;
    else
        cout << "Status: Busy" <<
        endl;
}