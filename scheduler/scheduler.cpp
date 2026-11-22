
#include <iostream>
#include <string>
#include "scheduler.h"

using namespace std;

int main(int argc, char* argv[])
{
    if (argc != 2)
    {
        cerr << "Usage: scheduler FCFS|SJF|PRIORITY\n";
        return 1;
    }

    string algorithm = argv[1];

    int n;
    cin >> n;

    if (n < 1 || n > 100)
    {
        cerr << "Number of orders must be between 1 and 100\n";
        return 1;
    }

    Order orders[100];

    for (int i = 0; i < n; i++)
    {
        cin >> orders[i].id
            >> orders[i].arrivalTime
            >> orders[i].prepTime
            >> orders[i].priority;

        orders[i].completionTime = 0;
        orders[i].waitingTime = 0;
        orders[i].turnaroundTime = 0;
    }

    if (algorithm == "FCFS")
    {
        fcfs(orders, n);
    }
    else if (algorithm == "SJF")
    {
        sjf(orders, n);
    }
    else if (algorithm == "PRIORITY")
    {
        priorityScheduling(orders, n);
    }
    else
    {
        cerr << "Invalid scheduling algorithm\n";
        return 1;
    }

    cout << "id,arrivalTime,prepTime,priority,completionTime,waitingTime,turnaroundTime\n";

    for (int i = 0; i < n; i++)
    {
        cout << orders[i].id << ","
             << orders[i].arrivalTime << ","
             << orders[i].prepTime << ","
             << orders[i].priority << ","
             << orders[i].completionTime << ","
             << orders[i].waitingTime << ","
             << orders[i].turnaroundTime << "\n";
    }

    return 0;
}
