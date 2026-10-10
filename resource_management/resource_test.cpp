#include <iostream>
#include "resource_manager.h"

using namespace std;

int main()
{
    ResourceManager manager;

    manager.addAgent(1, "Agent A");
    manager.addAgent(2, "Agent B");
    manager.addAgent(3, "Agent C");

    cout << "Initial Agent Status:\n";
    manager.showAgents();

    cout << "\nAssigning agents:\n";
    manager.assignAgent();
    manager.assignAgent();

    cout << "\nAgent Status After Assignment:\n";
    manager.showAgents();

    cout << "\nReleasing an agent:\n";
    manager.releaseAgent();

    cout << "\nFinal Agent Status:\n";
    manager.showAgents();

    return 0;
}