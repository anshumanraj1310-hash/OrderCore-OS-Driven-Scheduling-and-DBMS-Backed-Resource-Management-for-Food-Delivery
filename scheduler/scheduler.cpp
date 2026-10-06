#include <iostream>
#include "scheduler.h"

using namespace std;

void displayResults(Order orders[], int n)
{
    cout << "Order\tArrival\tPrep\tPriority\tCompletion\tWaiting\tTurnaround\n";

    for (int i = 0; i < n; i++)
    {
        cout << orders[i].id << "\t"
             << orders[i].arrivalTime << "\t"
             << orders[i].prepTime << "\t"
             << orders[i].priority << "\t\t"
             << orders[i].completionTime << "\t\t"
             << orders[i].waitingTime << "\t"
             << orders[i].turnaroundTime << endl;
    }
}

void resetOrders(Order orders[], int n)
{
    for (int i = 0; i < n; i++)
    {
        orders[i].completionTime = 0;
        orders[i].waitingTime = 0;
        orders[i].turnaroundTime = 0;
    }
}

int main()
{
    int n = 3;

    Order orders[3] =
    {
        {1, 0, 5, 2, 0, 0, 0},
        {2, 1, 3, 1, 0, 0, 0},
        {3, 2, 7, 3, 0, 0, 0}
    };

    cout << "===== FCFS Scheduling =====\n\n";

    fcfs(orders, n);
    displayResults(orders, n);

    resetOrders(orders, n);

    cout << "\n===== SJF Scheduling =====\n\n";

    sjf(orders, n);
    displayResults(orders, n);

    resetOrders(orders, n);

    cout << "\n===== Priority Scheduling =====\n\n";

    priorityScheduling(orders, n);
    displayResults(orders, n);

    return 0;
}