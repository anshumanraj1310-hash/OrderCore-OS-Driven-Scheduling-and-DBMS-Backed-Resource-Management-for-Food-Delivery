#ifndef AGENT_H
#define AGENT_H
#include <string> using namespace std;
class Agent
{ public:
int agent_id; string name; bool available;
Agent (int id, string n);
void showAgent();
};
#endif