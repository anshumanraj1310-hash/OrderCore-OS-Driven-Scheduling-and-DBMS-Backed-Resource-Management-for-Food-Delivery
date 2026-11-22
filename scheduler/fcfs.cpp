
#include <iostream>
#include <algorithm>
#include "scheduler.h"

using namespace std;

void fcfs(Order orders[], int n)
{
    // Sort orders by arrival time, then by order ID
    sort(orders, orders + n, [](const Order& a, const Order& b)
    {
        if (a.arrivalTime == b.arrivalTime)
        {
            return a.id < b.id;
        }

        return a.arrivalTime < b.arrivalTime;
    });

    int currentTime = 0;

    for (int i = 0; i < n; i++)
    {
        // Wait until the order arrives
        if (currentTime < orders[i].arrivalTime)
        {
            currentTime = orders[i].arrivalTime;
        }

        // Calculate completion time
        currentTime += orders[i].prepTime;
        orders[i].completionTime = currentTime;

        // Calculate turnaround time
        orders[i].turnaroundTime =
            orders[i].completionTime - orders[i].arrivalTime;

        // Calculate waiting time
        orders[i].waitingTime =
            orders[i].turnaroundTime - orders[i].prepTime;
    }
}
