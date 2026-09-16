//main scheduler logic + comparison of algorithms
#include <iostream>
#include "scheduler.h"

using namespace std;

int main()
{
    int n = 3;

    Order orders[3] =
    {
        {1, 0, 5, 2, 0, 0, 0},
        {2, 1, 3, 1, 0, 0, 0},
        {3, 2, 7, 3, 0, 0, 0}
    };

    fcfs(orders, n);

    cout << "FCFS Scheduling\n\n";

    cout << "Order\tArrival\tPrep\tCompletion\tWaiting\tTurnaround\n";

    for (int i = 0; i < n; i++)
    {
        cout << orders[i].id << "\t"
             << orders[i].arrivalTime << "\t"
             << orders[i].prepTime << "\t"
             << orders[i].completionTime << "\t\t"
             << orders[i].waitingTime << "\t"
             << orders[i].turnaroundTime << endl;
    }

    return 0;
}