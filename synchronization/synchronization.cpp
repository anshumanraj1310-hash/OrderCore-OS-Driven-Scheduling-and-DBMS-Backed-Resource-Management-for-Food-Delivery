
#include <iostream>
#include <mutex>
#include "synchronization.h"

using namespace std;

mutex orderMutex;

void processOrder(int orderId)
{
    lock_guard<mutex> lock(orderMutex);

    cout << "Processing Order " << orderId << endl;
    cout << "Order " << orderId
         << " is using the shared resource." << endl;
}
